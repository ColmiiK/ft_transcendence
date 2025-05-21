import { navigateTo } from "../../index.js";

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

export const columnMap: Map<string, HTMLElement[]> = new Map();

export const columnList: HTMLElement[] = [];

export const boardMap: Map<string, number[]> = new Map();

export const crazyTokens: string[] = ["🌀", "🌫️", "💣", "🔒", "👻", "🎲"];

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

export function enableClicks(columnList: HTMLElement[]): void {
	columnList.forEach((column) => {
        if (!column.classList.contains("opacity-50"))
		    column.style.pointerEvents = "auto";
	});
}

export function disableClicks(columnList: HTMLElement[]): void {
	columnList.forEach((column) => {
		column.style.pointerEvents = "none";
	});
}

export	function clearGame(player1: Player, player2: Player, columnList: HTMLElement[], columnMap: Map<string, HTMLElement[]>, boardMap: Map<string, number[]>): void {
    columnList.forEach((column) => {
        const newColumn = column.cloneNode(true);
        column.replaceWith(newColumn);
    });
	
    boardMap.clear();
    columnMap.clear();
    columnList = [];
	
    const winnerDiv = document.getElementById("winner");
    const drawDiv = document.getElementById("draw");
    if (winnerDiv){
		winnerDiv.style.display = "none";
        winnerDiv.classList.remove(`${player1.winner ? `${player1.color}` : `${player2.color}`}`);
    }
    if (drawDiv) drawDiv.style.display = "none";
}

export function insertDivWinner(player1: Player, player2: Player, columnList: HTMLElement[]): void {
		const winner = document.getElementById("winner");
		const playerWinner = player1.winner ? `${player1.color}` : `${player2.color}`;
		const player = player1.winner ? "Player 1" : "Player 2";
		if (winner){
			winner.classList.add(playerWinner);
			winner.style.display = "block";
			winner.innerHTML = `¡El <span>${player}</span> ha ganado!`;
		}
        console.log("EL jugador: ", player, " ha ganado.");
		disableClicks(columnList);
}

export function insertDivDraw(columnList: HTMLElement[]): void {
	const draw = document.getElementById("draw");
	if (!draw) return;

	draw.innerText = `¡Empate!`;
	draw.style.display = "block";
	disableClicks(columnList);
}

async function updateDice(player1: Player, player2: Player): Promise<void>{
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
            diceIcon.innerText = `⚪`
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

export async function placeToken(column: HTMLElement, player1: Player, player2: Player, columnMap: Map<string, HTMLElement[]>, boardMap: Map<string, number[]>, columnList: HTMLElement[], mode: string): Promise<void> {
    disableClicks(columnList);
    if (!column || !column.id) {
        enableClicks(columnList);
        console.error("Column or column ID is invalid: ", column);
        return;
    }

    const cells = columnMap.get(column.id);
    if (!cells) {
        enableClicks(columnList);
        console.error("Cells are undefined for column ID: ", column.id);
        return;
    }
    const columnData = boardMap.get(column.id);
    if (!columnData) {
        enableClicks(columnList);
        console.error("ColumnData is undefined for column ID: ", column.id, boardMap);
        return;
    }    

    const row = columnData.findIndex(cell => cell === 0);
    if (row === -1){
        enableClicks(columnList);
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

    disableClicks(columnList);
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
        enableClicks(columnList);
    }
    return Promise.resolve();
}

export async function returnToGames(columnList: HTMLElement[]): Promise<void> {
    const exitBtn = document.getElementById('exitGame');
    if (!exitBtn){
        console.error("exitGame element not found.");
        return Promise.resolve();
    }

    const pauseBtn = document.getElementById('pauseGame')
    if (!pauseBtn){
        console.error("pauseGame element not found.")
        return Promise.resolve();
    }

    const boardEl = document.getElementById('board');
    if (!boardEl){
        console.error("board element not found.")
        return Promise.resolve();
    }

    const diceEl = document.getElementById('dice-container');
    if (!diceEl){
        console.error("dice-container element not found.")
        return Promise.resolve();
    }

    disableClicks(columnList);
    diceEl.style.pointerEvents = 'none';
    exitBtn.style.pointerEvents = 'none';
    pauseBtn.style.pointerEvents = 'none';
    boardEl.style.animation = "mediumOpacity 0.25s ease forwards";
    await delay(250);

    const returnEl = document.getElementById('returnToGamesConnect');
    if (!returnEl){
        console.error("returnToGamesConnect element not found.");
        return Promise.resolve();
    }
    returnEl.style.display = 'block';

    document.getElementById('continue')?.addEventListener('click', async () => {
        returnEl.style.display = 'none';
        boardEl.style.animation = "fullOpacity 0.25s ease forwards";
        diceEl.style.pointerEvents = 'auto';
        exitBtn.style.pointerEvents = 'auto';
        pauseBtn.style.pointerEvents = 'auto';
        enableClicks(columnList);
        return ;
    })

    document.getElementById('exit')?.addEventListener('click', () => {
        /* localStorage.removeItem('gameState'); */
        navigateTo("/games");
    })
}