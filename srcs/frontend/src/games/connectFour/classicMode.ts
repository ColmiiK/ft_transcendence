import {
	Player,
    columnMap,
    columnList,
    boardMap,
	pauseGame,
	returnToGames,
	PlayerState,
	GameState,
	init as initEngine,
	clearGame as clearGameEngine,
	insertDivWinner as insertDivWinnerEngine,
	insertDivDraw as insertDivDrawEngine,
	checkDraw as checkDrawEngine,
	checkWin as checkWinEngine,
	enableClicks as enableClicksEngine,
	disableClicks as disableClicksEngine,
	placeToken as placeTokenEngine,
	isColumnPlayable as isColumnPlayableEngine,
	detectWinOpportunities as detectWinOpportunitiesEngine,
	updateTurnIndicator,
} from './gameEngine.js';

import { Games } from "../../types.js";
import { updateDescription } from '../../modify-profile/modify-fetch.js';

export function classicMode(data: Games): void {
	class PlayerClass implements Player {
		color: string;
		turn: boolean = false;
		winner: boolean = false;
		num: number;
		AI: boolean;

		constructor(AI: boolean, num: number, color: string) {
			this.AI = AI;
			this.num = num;
			this.color = color;
		}
	}

	const player1 = new PlayerClass(false, 1, "red");
	const player2 = new PlayerClass(data.gameMode === "ai" ? true : false, 2, "yellow");

	function init(): void {
		initEngine(player1, boardMap, columnMap, columnList);
	}

	async function start(): Promise<void> {
		const savedState = loadGameState("classic");
		init();
		if (savedState){
			renderBoardFromState(savedState)
			await pauseGame(columnList);
		}
		else
			enableClicks();
		clickColumn();
	}

	function clickColumn(){
		columnList.forEach((column: HTMLElement) => {
			column.addEventListener("click", () => handleColumnClick(column));
		});	
	}

	function clearGame(): void {
		localStorage.removeItem(`connect4GameStateclassic`);
		clearGameEngine(player1, player2, columnList, columnMap, boardMap);
	}

	function enableClicks(): void {
		enableClicksEngine(columnList);
	}

	function disableClicks(): void {
		disableClicksEngine(columnList);
	}

	async function handleColumnClick(column: HTMLElement): Promise<void> {
		if (player1.winner || player2.winner) {
			clearGame();
			return;
		}

		await placeToken(column);
		saveGameState("classic");
		if (checkWin(false)) {
			insertDivWinner();
			disableClicks();
		} else if (checkDraw()) {
			insertDivDraw();
			disableClicks();
		} else {
			if (player2.turn && player2.AI) {
				disableClicks();
				console.log("AI is thinking...");
				await aiToken();
				console.log("AI token placed");
			}
		}
	}

	function insertDivWinner(): void {
		insertDivWinnerEngine(player1, player2, columnList);
	}

	function insertDivDraw(): void {
		insertDivDrawEngine(columnList);
	}

	async function placeToken(column: HTMLElement | null): Promise<void> {
		await placeTokenEngine(column, player1, player2, columnMap, boardMap, columnList, "classic");
	}

	function checkDraw(): boolean {
		return checkDrawEngine(boardMap, columnList);
	}

	function checkWin(checking: boolean): boolean {
		return checkWinEngine(boardMap, columnList, player1, player2, checking);
	}

	async function aiToken(): Promise<void> {
		const winColumns = detectWinOpportunities(player2);
		if (winColumns.length > 0) {
			enableClicks();
			await winColumns[0].click();
			return;
		}

		const threatColumns = detectWinOpportunities(player1);
		if (threatColumns.length > 0) {
			enableClicks();
			await threatColumns[0].click();
			return;
		}

		let columnToUse: HTMLElement | null = Math.random() < 0.2
			? columnList[Math.floor(Math.random() * columnList.length)]
			: null;

		if (!columnToUse){
			const boardState = {
				boardMap: Object.fromEntries(
					Array.from(boardMap.entries()).map(([key, value]) => [key, [...value]])
				),
				columnIds: columnList.map(col => col.id),
				player1: { num: player1.num },
				player2: { num: player2.num }
        	};

			const worker = new Worker(new URL('./aiWorker.js', import.meta.url));
			
			const bestColumnId = await new Promise<string>((resolve) => {
				worker.onmessage = (e) => resolve(e.data);
				worker.postMessage({ 
					boardState,
					depth: 5
				});
			});

			worker.terminate();
			columnToUse = columnList.find(col => col.id === bestColumnId) || null;
		}

		if (columnToUse && !isColumnPlayable(columnToUse)) {
			columnToUse = columnList.find((column) => isColumnPlayable(column)) || null;
		}

		enableClicks();
		columnToUse?.click();
	}

	function isColumnPlayable(column: HTMLElement): boolean {
		return isColumnPlayableEngine(column, boardMap);
	}

	function detectWinOpportunities(player: Player): HTMLElement[] {
		return detectWinOpportunitiesEngine(boardMap, columnList, player, player1, player2);
	}

	function getPlayerState(player: Player): PlayerState {
		const playerS = {
			num: player.num,
			color: player.color,
			turn: player.turn,
			AI: player.AI,
		}
		return playerS;
	}

	function setPlayerState(player: Player, state: PlayerState) {
		player.num = state.num;
		player.color = state.color;
		player.turn = state.turn;
		player.AI = state.AI;
	}

	function saveGameState(mode: "classic" | "custom") {
		const boardData: { [columnId: string]: number[] } = {};

		columnList.forEach(column => {
			const data = boardMap.get(column.id);
			if (data) boardData[column.id] = [...data];
		});

		const state: GameState = {
			mode,
			boardData,
			player1: getPlayerState(player1),
			player2: getPlayerState(player2),
		};

		localStorage.setItem(`connect4GameState${mode}`, JSON.stringify(state));
	}

	function loadGameState(mode: "classic" | "custom"): GameState | null {
		const stateStr = localStorage.getItem(`connect4GameState${mode}`);
		if (!stateStr) return null;

		const state: GameState = JSON.parse(stateStr);
		return state;
	}

	function renderBoardFromState(state: GameState) {
		for (const colId in state.boardData) {
			boardMap.set(colId, [...state.boardData[colId]]);
		}

		columnList.forEach(column => {
			const cells = columnMap.get(column.id);
			if (!cells) return;

			for (let row = 0; row < cells.length; row++) {
				const cell = cells[row];
				cell.innerHTML = "";
				cell.className = "cell";

				const cellValue = boardMap.get(column.id)?.[row] || 0;

				if (cellValue === 1) {
					cell.classList.add("filled", "red-hover");
					const token = document.createElement("div");
					token.className = "token red";
					cell.appendChild(token);
				} else if (cellValue === 2) {
					cell.classList.add("filled", "yellow-hover");
					const token = document.createElement("div");
					token.className = "token yellow";
					cell.appendChild(token);
				} else {
					if (state.player1.turn) cell.classList.add("red-hover");
					else cell.classList.add("yellow-hover");
				}
			}
		});
	
		setPlayerState(player1, state.player1);
		setPlayerState(player2, state.player2);
	}

	document.getElementById('pauseGame')?.addEventListener('click', async () => {
		await pauseGame(columnList);
	})

	document.getElementById('exitGame')?.addEventListener('click', async () => {
		await returnToGames(columnList);
	})

	start();
}

/* function getPlayerState(player: Player): PlayerState {
		const playerS = {
			num: player.num,
			color: player.color,
			turn: player.turn,
			specialToken: player.specialToken,
			diceUses: player.diceUses,
			useSpecial: player.useSpecial,
			affected: player.affected,
			turnAffected: player.turnAffected,
		}
		return playerS;
	}

	function setPlayerState(player: Player, state: PlayerState) {
		player.num = state.num;
		player.color = state.color;
		player.turn = state.turn;
		player.specialToken = state.specialToken;
		player.diceUses = state.diceUses;
		player.useSpecial = state.useSpecial;
		player.affected = state.affected;
		player.turnAffected = state.turnAffected;
	}

	function saveGameState(mode: "classic" | "custom", player1: Player, player2: Player) {
	const boardData: { [columnId: string]: number[] } = {};
	columnList.forEach(column => {
		const data = boardMap.get(column.id);
		if (data) boardData[column.id] = [...data];
	});

	const state: GameState = {
		mode,
		boardData,
		player1: getPlayerState(player1),
		player2: getPlayerState(player2),
	};

	localStorage.setItem(`connect4GameState${mode}`, JSON.stringify(state));
	}

	function loadGameState(mode: "classic" | "custom"): GameState | null {
	const stateStr = localStorage.getItem(`connect4_game_state_${mode}`);
	if (!stateStr) return null;

	const state: GameState = JSON.parse(stateStr);
	return state;
	}

	function renderBoardFromState(state: GameState, player1: Player, player2: Player) {
	for (const colId in state.boardData) {
		boardMap.set(colId, [...state.boardData[colId]]);
	}

	columnList.forEach(column => {
		const cells = columnMap.get(column.id);
		if (!cells) return;

		for (let row = 0; row < cells.length; row++) {
		const cell = cells[row];
		cell.innerHTML = "";
		cell.className = "cell";

		const cellValue = boardMap.get(column.id)?.[row] || 0;

		if (cellValue === 1) {
			cell.classList.add("filled", "red-hover");
			const token = document.createElement("div");
			token.className = "token red";
			cell.appendChild(token);
		} else if (cellValue === 2) {
			cell.classList.add("filled", "yellow-hover");
			const token = document.createElement("div");
			token.className = "token yellow";
			cell.appendChild(token);
		} else if (cellValue === 3) {
			cell.classList.add("filled");
			const token = document.createElement("div");
			token.className = "token ghostToken opacity-50 grayscale";
			token.innerText = "👻";
			cell.appendChild(token);
		} else {
			if (state.player1.turn) {
			cell.classList.add("red-hover");
			} else {
			cell.classList.add("yellow-hover");
			}
		}
		}
	});
	
	setPlayerState(player1, state.player1);
	setPlayerState(player2, state.player2);
	updateTurnIndicator();

} */