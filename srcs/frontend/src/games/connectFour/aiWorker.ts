import { getTranslation } from "../../functionalities/transcript";

interface BoardState {
    boardMap: { [key: string]: number[] };
    columnIds: string[];
    player1: { num: number };
    player2: { num: number };
}

let isCalculating = false;
let calculationStartTime = 0;
const maxTime = 2500;

self.onmessage = (e: MessageEvent) => {
    if (isCalculating) {
        const { boardState } = e.data;
        const randomColumn = getRandomPlayableColumn(boardState);
        self.postMessage(randomColumn);
        return;
    }

    isCalculating = true;
    calculationStartTime = Date.now();
    
    const { boardState, depth } = e.data;
    
    try {
        const boardStateCopy = deepCopyBoardState(boardState);
        const result = findBestMove(boardStateCopy, depth);
        self.postMessage(result);
    } catch (error) {
        console.error(getTranslation('game_aiworker_error'), error);
        const randomColumn = getRandomPlayableColumn(boardState);
        self.postMessage(randomColumn);
    } finally {
        isCalculating = false;
    }
};

function deepCopyBoardState(boardState: BoardState): BoardState {
    return {
        boardMap: Object.fromEntries(
            Object.entries(boardState.boardMap).map(([key, value]) => [key, [...value]])
        ),
        columnIds: [...boardState.columnIds],
        player1: { ...boardState.player1 },
        player2: { ...boardState.player2 }
    };
}

function getRandomPlayableColumn(boardState: BoardState): string {
    const playableColumns = boardState.columnIds.filter(columnId => 
        isColumnPlayable(boardState.boardMap[columnId])
    );
    return playableColumns[Math.floor(Math.random() * playableColumns.length)] || boardState.columnIds[0];
}

function findBestMove(boardState: BoardState, depth: number): string {
    let bestScore = -Infinity;
    let bestColumnId = '';

    for (const columnId of boardState.columnIds) {
        if (Date.now() - calculationStartTime > maxTime) {
            /* console.log('AI calculation timeout, using current best or random'); */
            break;
        }

        const columnData = boardState.boardMap[columnId];
        if (!isColumnPlayable(columnData)) continue;

        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1) continue;

        columnData[row] = boardState.player2.num;
        
        if (checkWin(boardState, columnId, row, boardState.player2.num)) {
            columnData[row] = 0;
            return columnId;
        }
        
        const potential = evaluateColumnPotential(boardState, columnId, boardState.player2.num);
        const score = minmax(depth - 1, false, -Infinity, Infinity, boardState) + potential;
        
        columnData[row] = 0;

        if (score > bestScore) {
            bestScore = score;
            bestColumnId = columnId;
        }
    }

    return bestColumnId || getRandomPlayableColumn(boardState);
}

function minmax(depth: number, isMax: boolean, alpha: number, beta: number, boardState: BoardState): number {
    if (Date.now() - calculationStartTime > maxTime) {
        return evaluateBoard(boardState);
    }

    if (checkDraw(boardState)) return 0;
    if (depth === 0) return evaluateBoard(boardState);

    if (isMax) {
        let maxEval = -Infinity;
        for (const columnId of boardState.columnIds) {
            const columnData = boardState.boardMap[columnId];
            if (!isColumnPlayable(columnData)) continue;

            const row = columnData.findIndex(cell => cell === 0);
            if (row === -1) continue;

            columnData[row] = boardState.player2.num;
            const evaluation = minmax(depth - 1, false, alpha, beta, boardState);
            columnData[row] = 0;

            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const columnId of boardState.columnIds) {
            const columnData = boardState.boardMap[columnId];
            if (!isColumnPlayable(columnData)) continue;

            const row = columnData.findIndex(cell => cell === 0);
            if (row === -1) continue;

            columnData[row] = boardState.player1.num;
            const evaluation = minmax(depth - 1, true, alpha, beta, boardState);
            columnData[row] = 0;

            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function checkWin(boardState: BoardState, columnId: string, row: number, playerNum: number): boolean {
    const col = boardState.columnIds.indexOf(columnId);
    const directions = [
        {x: 1, y: 0},  
        {x: 0, y: 1},   
        {x: 1, y: 1},   
        {x: 1, y: -1}  
    ];

    for (const {x, y} of directions) {
        let count = 1;
        
        for (let i = 1; i < 4; i++) {
            const newCol = col + i * x;
            const newRow = row + i * y;
            if (newCol < 0 || newCol >= boardState.columnIds.length || 
                newRow < 0 || newRow >= 6) break;
            
            const newColumnId = boardState.columnIds[newCol];
            if (boardState.boardMap[newColumnId][newRow] === playerNum) {
                count++;
            } else break;
        }
        
        for (let i = 1; i < 4; i++) {
            const newCol = col - i * x;
            const newRow = row - i * y;
            if (newCol < 0 || newCol >= boardState.columnIds.length || 
                newRow < 0 || newRow >= 6) break;
            
            const newColumnId = boardState.columnIds[newCol];
            if (boardState.boardMap[newColumnId][newRow] === playerNum) {
                count++;
            } else break;
        }
        
        if (count >= 4) return true;
    }
    
    return false;
}

function isColumnPlayable(columnData: number[]): boolean {
    return columnData.some(cell => cell === 0);
}

function checkDraw(boardState: BoardState): boolean {
    return Object.values(boardState.boardMap).every(column => 
        !column.some(cell => cell === 0)
    );
}

function evaluateBoard(boardState: BoardState): number {
    let score = 0;
    
    score += evaluateLines(boardState, 1, 0);
    score += evaluateLines(boardState, 0, 1);
    score += evaluateLines(boardState, 1, 1);
    score += evaluateLines(boardState, 1, -1);
    
    return score;
}

function evaluateLines(boardState: BoardState, deltaX: number, deltaY: number): number {
    let score = 0;
    const columnCount = boardState.columnIds.length;
    const rowCount = 6;

    for (let startCol = 0; startCol < columnCount; startCol++) {
        for (let startRow = 0; startRow < rowCount; startRow++) {
            if (startCol + 3 * deltaX >= columnCount || startCol + 3 * deltaX < 0) continue;
            if (startRow + 3 * deltaY >= rowCount || startRow + 3 * deltaY < 0) continue;
            
            score += evaluateWindow(boardState, startCol, startRow, deltaX, deltaY);
        }
    }
    return score;
}

function evaluateWindow(boardState: BoardState, col: number, row: number, deltaX: number, deltaY: number): number {
    const window: number[] = [];
    
    for (let i = 0; i < 4; i++) {
        const currentCol = col + i * deltaX;
        const currentRow = row + i * deltaY;
        
        if (currentCol >= 0 && currentCol < boardState.columnIds.length && 
            currentRow >= 0 && currentRow < 6) {
            const columnId = boardState.columnIds[currentCol];
            const cellValue = boardState.boardMap[columnId][currentRow];
            window.push(cellValue);
        } else {
            return 0;
        }
    }

    if (window.length !== 4) return 0;
    
    const ai = window.filter(cell => cell === boardState.player2.num).length;
    const human = window.filter(cell => cell === boardState.player1.num).length;
    const empty = window.filter(cell => cell === 0).length;
    
    if (ai > 0 && human > 0) return 0;
    
    if (ai === 4) return 100;
    if (human === 4) return -100;
    if (ai === 3 && empty === 1) return 10;
    if (human === 3 && empty === 1) return -10;
    if (ai === 2 && empty === 2) return 2;
    if (human === 2 && empty === 2) return -2;
    
    return 0;
}

function evaluateColumnPotential(boardState: BoardState, columnId: string, playerNum: number): number {
    let potential = 0;
    const columnData = boardState.boardMap[columnId];
    
    let verticalCount = 0;
    for (let i = columnData.length - 1; i >= 0; i--) {
        if (columnData[i] === 0) break;
        if (columnData[i] === playerNum) {
            verticalCount++;
        } else {
            break;
        }
    }
    
    if (verticalCount >= 3) potential += 50;
    
    const col = boardState.columnIds.indexOf(columnId);
    const row = columnData.findIndex(cell => cell === 0);
    
    if (row !== -1) {
        potential += calculatePositionPotential(boardState, col, row, playerNum);
    }
    
    return potential;
}

function calculatePositionPotential(boardState: BoardState, col: number, row: number, playerNum: number): number {
    let potential = 0;
    const directions = [
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 1, y: -1}
    ];
    
    for (const {x, y} of directions) {
        let friendlyCount = 0;
        let emptyCount = 0;
        let blocked = false;
        
        for (let dir of [-1, 1]) {
            for (let i = 1; i <= 3; i++) {
                const newCol = col + i * x * dir;
                const newRow = row + i * y * dir;
                
                if (newCol < 0 || newCol >= boardState.columnIds.length || 
                    newRow < 0 || newRow >= 6) {
                    blocked = true;
                    break;
                }
                
                const columnId = boardState.columnIds[newCol];
                const value = boardState.boardMap[columnId][newRow];
                
                if (value === 0) {
                    emptyCount++;
                } else if (value === playerNum) {
                    friendlyCount++;
                } else {
                    blocked = true;
                    break;
                }
            }
            if (blocked) break;
        }
        
        if (!blocked && friendlyCount + emptyCount >= 3) {
            potential += friendlyCount * 3;
        }
    }
    
    return potential;
}