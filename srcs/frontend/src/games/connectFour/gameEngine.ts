import { getClientID } from "../../messages/messages-page.js";

export let socket4inrow: WebSocket | null;

export interface Player {
    color: string;
    turn: boolean;
    winner: boolean;
    num: number;
    AI: boolean;
    count?: number;
    specialToken?: string | null;
    useSpecial?: boolean;
    affected?: string | null;
    turnAffected?: number;
    diceUses?: number;
}

export interface PlayerState {
  num: number;
  color: string;
  turn: boolean;
  AI: boolean;
  winner: boolean,
  specialToken?: string | null;
  diceUses?: number;
  useSpecial?: boolean;
  affected?: string | null;
  turnAffected?: number;
}

export interface GameState {
  mode: "classic" | "custom";
  boardData: Record<string, { player: number, emoji: string | null }[]>;
  player1: PlayerState;
  player2: PlayerState;
}

export let columnMap: Map<string, HTMLElement[]> = new Map();

export let columnClickHandlers = new Map<HTMLElement, () => Promise<void>>();

export let columnList: HTMLElement[] = [];

export let boardMap: Map<string, number[]> = new Map();

export let crazyTokens: string[] = ["🌀", "🌫️", "💣", "🔒", "👻", "🎲"];

export function setArray(num: string) {
	let array = new Array();
	
    for (let i = 1; i <= 6; i++)
        array.push(document.getElementById("c" + num + i.toString()));
	return array;
}

export function init(player1: Player, boardMap: Map<string, number[]>, columnMap: Map<string, HTMLElement[]>, columnList: HTMLElement[]): void {
	player1.turn = true;
	
    for (let i = 1; i <= 7; i++) {
		boardMap.set(("c" + i.toString()), Array(6).fill(0));
        columnMap.set("c" + i.toString(), setArray(i.toString()));
        
        let columnId = document.getElementById("c" + i.toString())
        if (columnId)
            columnList.push(columnId);
    }
}

export async function enableClicks(columnList: HTMLElement[]): Promise<void> {
	columnList.forEach((column) => {
        if (!column.classList.contains("opacity-50"))
		    column.style.pointerEvents = "auto";
	});
}

export async function disableClicks(columnList: HTMLElement[]): Promise<void> {
	columnList.forEach((column) => {
		column.style.pointerEvents = "none";
	});
}

export	function clearGame(player1: Player, player2: Player, columnList: HTMLElement[], columnMap: Map<string, HTMLElement[]>, boardMap: Map<string, number[]>): void {
    boardMap.clear();
    columnMap.clear();
    for (let i = 0; i < columnList.length; i++)
        columnList.pop()
    columnList.length = 0;
	
    player1.winner = false;
    player2.winner = false;
    player1.turn = false;
    player2.turn = false;
    const columnIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"];
    columnIds.forEach(colId => {
        boardMap.set(colId, Array(6).fill(0));
    });

    const winnerDiv = document.getElementById("winner");
    const drawDiv = document.getElementById("draw");
    const diceDiv = document.getElementById("dice-container");
    if (winnerDiv){
		winnerDiv.style.display = "none";
        winnerDiv.classList.remove(`${player1.winner ? `${player1.color}` : `${player2.color}`}`);
    }
    if (drawDiv) drawDiv.style.display = "none";
    if (diceDiv) diceDiv.style.display = "none";
}

export function insertDivWinner(player1: Player, player2: Player, columnList: HTMLElement[]): void {
		const winner = document.getElementById("winner");
		const playerWinner = player1.winner ? `${player1.color}` : `${player2.color}`;
		const player = player1.winner ? "Player 1" : "Player 2";
		if (winner){
			winner.classList.add(playerWinner);
			winner.style.display = "block";
			winner.innerHTML = `¡Player <span>${player}</span> wins!`;
		}
        console.log("Player: ", player, " wins.");
		disableClicks(columnList);
}

export function insertDivDraw(columnList: HTMLElement[]): void {
	const draw = document.getElementById("draw");
	if (!draw) return;

	draw.innerText = `¡Draw!`;
	draw.style.display = "block";
	disableClicks(columnList);
}

export async function updateDice(player1: Player, player2: Player): Promise<void>{
        const currentPlayer = player1.turn ? player1 : player2;

        const diceContainer = document.getElementById("dice-container");
		if (!diceContainer) return;

        diceContainer.style.backgroundColor = `${currentPlayer.color === "red" ? 
            `rgba(255, 2, 2, 0.811)` : `rgba(255, 237, 35, 0.874)`}`;
        diceContainer.style.transition = `background-color 0.5s ease-in-out`;
        
        const diceIcon = document.getElementById("dice-icon");
		if (!diceIcon) return;
        
        if (currentPlayer.specialToken != null)
            diceIcon.innerText = `${currentPlayer.specialToken}`
        else if (!currentPlayer.specialToken && currentPlayer.diceUses == 0)
            diceIcon.innerText = `❌`;
        else
            diceIcon.innerText = `⚪`;
		await delay(300);
}  

export async function updateTurnIndicator(player1: Player, player2: Player, columnList: HTMLElement[], columnMap: Map<string, HTMLElement[]>, mode: string): Promise<void> {
        player1.turn = !player1.turn;
        player2.turn = !player2.turn;

        const currentPlayer = player1.turn ? player1 : player2;
        columnList.forEach((column: HTMLElement) => {
            const cells = columnMap.get(column.id);
            if (!cells) return ;

            cells.forEach((cell: HTMLElement) => {
                if (cell.classList.contains("cell") && !player2.AI) {
                    cell.classList.remove("red-hover", "yellow-hover");
                if (currentPlayer.color === "red") {
                    cell.classList.add("red-hover");
                } else if (currentPlayer.color === "yellow") {
                    cell.classList.add("yellow-hover");
                }
                }
            });
        });
        if (mode == "crazy") 
            await updateDice(player1, player2);
        console.log(`Turn: ${currentPlayer.num}, color: ${currentPlayer.color}`);
}


async function updateCell(cell: HTMLElement, player: Player): Promise<void> {
        const token = document.createElement("div");

        token.className = `token ${player.color}`;
        token.style.animation = "token 0.5s ease-in forwards";
        cell.className = "filled";
        cell.appendChild(token);
        await delay(500)
        token.style.animation = "";
}

export async function placeToken(column: HTMLElement | null, player1: Player, player2: Player, columnMap: Map<string, HTMLElement[]>, boardMap: Map<string, number[]>, columnList: HTMLElement[], mode: string): Promise<void> {
    disableClicks(columnList);
    if (!column || !column.id) {
        await enableClicks(columnList);
        console.error("Column or column ID is invalid: ", column);
        return;
    }

    const cells = columnMap.get(column.id);
    if (!cells) {
        await enableClicks(columnList);
        console.error("Cells are undefined for column ID: ", column.id);
        return;
    }
    const columnData = boardMap.get(column.id);
    if (!columnData) {
        await enableClicks(columnList);
        console.error("ColumnData is undefined for column ID: ", column.id, boardMap);
        return;
    }    

    const row = columnData.findIndex(cell => cell === 0);
    if (row === -1){
        await enableClicks(columnList);
        console.error("No rows left in column: ", column);
        return ;
    }

    const currentPlayer = player1.turn ? player1 : player2;
    columnData[row] = currentPlayer.num;

    await updateCell(cells[row], currentPlayer);
    await updateTurnIndicator(player1, player2, columnList, columnMap, mode);
    enableClicks(columnList);
}

export function checkDraw(boardMap: Map<string, number[]>, columnList: HTMLElement[]): boolean {
    let draw = true;

    columnList.forEach((column) => {
        const columnData = boardMap.get(column.id);
        if (!columnData) return;
        
        const row = columnData.findIndex(cell => cell === 0);
        if (row !== -1) draw = false;
    });
    return draw;
}

export function checkWin(boardMap: Map<string, number[]>, columnList: HTMLElement[], player1: Player, player2: Player, checking: boolean): boolean {
	const directions = [
		{ x: 0, y: 1 },
		{ x: 1, y: 0 },
		{ x: 1, y: 1 },
		{ x: 1, y: -1 },
	];

	for (let col = 0; col < columnList.length; col++) {
		const columnId = columnList[col].id;
		const columnData = boardMap.get(columnId);
        if (!columnData) break ;

		for (let row = 0; row < columnData.length; row++) {
			const currentPlayer = columnData[row];
			if (currentPlayer === 0) continue;

			if (checkDirection(col, row, currentPlayer, directions, columnList, boardMap)) {
				if (!checking) 
					player1.num === currentPlayer ? player1.winner = true : player2.winner = true;
				return true;
			}
		}
	}
	return false;
}

function checkDirection(col: number, row: number, player: number, directions: { x: number; y: number }[], columnList: HTMLElement[], boardMap: Map<string, number[]>): boolean {
	for (const { x, y } of directions) {
		let count = 1;

		for (const step of [1, -1]) {
			for (let s = 1; s < 4; s++) {
				const newCol = col + x * s * step;
				const newRow = row + y * s * step;
                if (newCol < 0 || newCol >= columnList.length || newRow < 0 || newRow >= 6 )
                    break;
                const column = boardMap.get(columnList[newCol].id);
                if (!column) break ;

				if (newCol >= 0 &&
					newCol < columnList.length &&
					newRow >= 0 &&
					newRow < 6 &&
					column[newRow] === player) {
					count++;
				} else break;
			}
		}
		if (count >= 4) return true;
	}
	return false;
}

export function isColumnPlayable(column: HTMLElement, boardMap: Map<string, number[]>): boolean {
	if (!column || !column.id) return false;
	
	if (column.classList.contains("opacity-50")) return false;
	
	const columnData = boardMap.get(column.id);
	if (!columnData) return false;
	
	const hasEmptyCell = columnData.some(cell => cell === 0);
	return hasEmptyCell;
}

export function detectWinOpportunities(boardMap: Map<string, number[]>, columnList: HTMLElement[], player: Player, player1: Player, player2: Player): HTMLElement[] {
    const winColumns: HTMLElement[] = [];

	columnList.forEach((column) => {
		if (!isColumnPlayable(column, boardMap)) return;

		const columnData = boardMap.get(column.id);
        if (!columnData) return ;

		const row = columnData.findIndex(cell => cell === 0);
		if (row === -1) return;

		columnData[row] = player.num;
		const wouldWin = checkWin(boardMap, columnList, player1, player2, true);
		columnData[row] = 0;

		if (wouldWin) winColumns.push(column);
	});

	return winColumns;
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function pauseGame(columnList: HTMLElement[]): Promise<void> {
    const pauseEl = document.getElementById('pauseConnect');
    if (!pauseEl){
        console.error("pauseConnect element not found.");
        return Promise.resolve();
    }

    const boardEl = document.getElementById('board');
    if (!boardEl){
        console.error("board element not found.")
        return Promise.resolve();
    }

    const pauseBtn = document.getElementById('pauseGame')
    if (!pauseBtn){
        console.error("pauseGame element not found.")
        return Promise.resolve();
    }

    const exitBtn = document.getElementById('exitGame');
    if (!exitBtn){
        console.error("exitGame element not found.");
        return Promise.resolve();
    }

    const diceEl = document.getElementById('dice-container');
    if (!diceEl){
        console.error("dice-container element not found.")
        return Promise.resolve();
    }

    diceEl.style.pointerEvents = 'none';
    exitBtn.style.pointerEvents = 'none';

    if (pauseEl.style.display !== 'block'){
        pauseEl.style.display = 'block';
        boardEl.style.animation = "mediumOpacity 0.25s ease forwards";
        await delay(250);
    }
    else{
        exitBtn.style.pointerEvents = 'auto';
        diceEl.style.pointerEvents = 'auto';
        boardEl.style.animation = "fullOpacity 0.25s ease forwards";
        pauseEl.style.display = 'none';
    }
    return Promise.resolve();
}

export function getPlayerState(player: Player): PlayerState {
    const playerS = {
        num: player.num,
        color: player.color,
        turn: player.turn,
        AI: player.AI,
        winner: player.winner,
        specialToken: player.specialToken,
        diceUses: player.diceUses,
        useSpecial: player.useSpecial,
        affected: player.affected,
        turnAffected: player.turnAffected,
    }
    return playerS;
}

export function setPlayerState(player: Player, state: PlayerState) {
    player.num = state.num;
    player.color = state.color;
    player.turn = state.turn;
    player.AI = state.AI;
    player.winner = state.winner;
    player.specialToken = state.specialToken;
    player.diceUses = state.diceUses;
    player.useSpecial = state.useSpecial;
    player.affected = state.affected;
    player.turnAffected = state.turnAffected;
}

export  function saveGameState(mode: "classic" | "custom", player1: Player, player2: Player): void {
    const boardData: Record<string, { player: number, emoji: string | null }[]> = {};

    for (const [colId, colData] of boardMap.entries()) {
        const cells = columnMap.get(colId);
        if (!cells) continue;

        const cellStates = colData.map((cellValue, rowIndex) => {
            const cell = cells[rowIndex];
            const token = cell.querySelector('.token');
            const emoji = token?.textContent || null;

            return {
            player: cellValue,
            emoji,
            };
        });

        boardData[colId] = cellStates;
    }

    const gameState = {
        mode,
        boardData,
        player1: getPlayerState(player1),
        player2: getPlayerState(player2),
    };

    localStorage.setItem(`connect4GameState${mode}`, JSON.stringify(gameState));
}

export function loadGameState(mode: "classic" | "custom"): GameState | null {
    const stateStr = localStorage.getItem(`connect4GameState${mode}`);
    if (!stateStr) return null;

    const state: GameState = JSON.parse(stateStr);
    return state;
}

export function renderBoardFromState(gameState: GameState, player1: Player, player2: Player): void {
    setPlayerState(player1, gameState.player1);
    setPlayerState(player2, gameState.player2);

    for (const [colId, cellData] of Object.entries(gameState.boardData)) {
        boardMap.set(colId, cellData.map(c => c.player));
        
        const cells = columnMap.get(colId);
        if (!cells) continue;

        cellData.forEach((cellState, rowIndex) => {
            const cell = cells[rowIndex];
            cell.innerHTML = '';
            
            const currentPlayer = player1.turn ? player1 : player2;
            cell.className = `cell ${currentPlayer.color}-hover`;

            if (cellState.player !== 0) {
                const token = document.createElement('div');
                token.className = 'token';

                if (cellState.player === 1) {
                    token.classList.add('red');
                } else if (cellState.player === 2) {
                    token.classList.add('yellow');
                }

                if (cellState.emoji) {
                    token.textContent = cellState.emoji;
                    
                    switch (cellState.emoji) {
                        case "👻":
                            token.classList.add("ghostToken");
                            break;
                        case "🎲":
                            token.classList.add("diceToken");
                            break;
                        case "🔒":
                            token.classList.add("lockToken");
                            break;
                        case "🌫️":
                            token.classList.add("blindToken");
                            break;
                        default:
                            break;
                    }
                }

                cell.appendChild(token);
                cell.classList.add('filled');
                cell.classList.remove('red-hover', 'yellow-hover');
            }
        });
    }

    if (gameState.mode === "custom") updateDice(player1, player2);
}

export function createSocket4inrowConnection(){
if (socket4inrow && socket4inrow.readyState !== WebSocket.CLOSED)
        socket4inrow.close();
    try{
        socket4inrow = new WebSocket(`wss://${window.location.hostname}:8443/ws/4inrow`)
        if (!socket4inrow)
            return ;
        socket4inrow.onopen = () => {
            let id = getClientID();
            console.log("WebSocket4inrow connection established, sending id:", id);
            if (id === -1)
                console.error("Invalid ID, cannot connect to back")
            else{
                if (!socket4inrow)
                    return ;
                socket4inrow.send(JSON.stringify({
                    userId: id,
                    action: "identify"
                }));
                console.log("ID succesfully sent");
            }
        };
        socket4inrow.onmessage = (event) => {
            try{
                const data = JSON.parse(event.data);
                
            }
            catch(err){
                console.error("Error on message", err);
            }
        };
        socket4inrow.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
        socket4inrow.onclose = () => {
            console.log("WebSocket4inrow connection closed");
            socket4inrow = null;
        };
    }
    catch(err){
        console.error("Error creating WebSocket4inrow:", err);
    }
}
