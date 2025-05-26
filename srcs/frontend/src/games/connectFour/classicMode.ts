import {
	Player,
    columnMap,
    columnList,
    boardMap,
	columnClickHandlers,
	pauseGame,
	delay,
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
} from './gameEngine.js';


import { Games } from "../../types.js";
import { navigateTo } from "../../index.js";
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

	let player1 = new PlayerClass(false, 1, "red");
	let player2 = new PlayerClass(data.gameMode === "ai" ? true : false, 2, "yellow");

	let gameActive: boolean = true;
	let aiIsThinking: boolean = false;
	let aiWorker: Worker | null = null;
	let aiColumn: HTMLElement | null = null;
	let aiInterval: NodeJS.Timeout | null = null;
	

	function init(): void {
		initEngine(player1, boardMap, columnMap, columnList);
		gameActive = true;

		if (player2.AI)
			initAI();
	}

	function initAI(): void {
		if (aiInterval) {
			clearInterval(aiInterval);
			aiInterval = null;
		}
		
		if (aiWorker) {
			aiWorker.terminate();
			aiWorker = null;
		}
		aiColumn = null;

		aiWorker = new Worker(new URL('./aiWorker.js', import.meta.url));
		aiInterval = setInterval(async () => {
			if (!gameActive) {
				return;
			}
			
			if (!aiColumn && player2.turn && player2.AI && !aiIsThinking) {
				console.log("AI calculando movimiento...");
				aiColumn = await aiToken();
				console.log("AI decidió columna:", aiColumn?.id);
			}
			
			if (player2.turn && player2.AI && aiColumn && aiIsThinking) {
				aiIsThinking = false;
				await aiColumn.click();
				aiIsThinking = false;
				aiColumn = null;
			}
		}, 1000);
	}

	async function start(): Promise<void> {
		const savedState = loadGameState();
		init();
		if (savedState){
			renderBoardFromState(savedState)
			await pauseGame(columnList);
		}
		else
			await enableClicks();
		handlerEvents();
	}

	function handlerEvents(){
		columnClickHandlers.forEach((handler, column) => {
			column.removeEventListener("click", handler);
		});
		columnClickHandlers.clear();
		columnList.forEach((column: HTMLElement) => {
			const handler = () => handleColumnClick(column);
			columnClickHandlers.set(column, handler);
			column.addEventListener("click", handler);
		});	
	}

	function clearGame(): void {
		localStorage.removeItem(`connect4GameStateclassic`);
		gameActive = false;
		clearGameEngine(player1, player2, columnList, columnMap, boardMap);
		if (aiInterval) {
			clearInterval(aiInterval);
			aiInterval = null;
		}
		
		if (aiWorker) {
			aiWorker.terminate();
			aiWorker = null;
		}
		aiColumn = null;
	}

	async function enableClicks(): Promise<void> {
		await enableClicksEngine(columnList);
	}

	async function disableClicks(): Promise<void> {
		await disableClicksEngine(columnList);
	}

	async function handleColumnClick(column: HTMLElement): Promise<void> {
		if (!gameActive || player1.winner || player2.winner) {
			clearGame();
			return;
		}

		if (player2.turn && player2.AI && !aiColumn) {
			return ;
		}
		else if (player2.turn && player2.AI && aiColumn){
			column = aiColumn;
		}
		await placeToken(column);
		await saveGameState("classic");
		if (checkWin(false)) {
			insertDivWinner();
			await disableClicks();
			gameActive = false;
		} else if (checkDraw()) {
			insertDivDraw();
			await disableClicks();
			gameActive = false;
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

	async function aiToken(): Promise<HTMLElement | null> {
		if (!gameActive || !aiWorker || !player2.turn || aiColumn || aiIsThinking)
			return null;
		aiIsThinking = true;

		const winColumns = detectWinOpportunities(player2);
		if (winColumns.length > 0) {
			return winColumns[0];
		}

		const threatColumns = detectWinOpportunities(player1);
		if (threatColumns.length > 0) {
			return threatColumns[0];
		}

		let columnToUse: HTMLElement | null = Math.random() < 0.2
			? columnList[Math.floor(Math.random() * columnList.length)]
			: null;

		if (!columnToUse && aiWorker){
			const boardState = {
				boardMap: Object.fromEntries(
					Array.from(boardMap.entries()).map(([key, value]) => [key, [...value]])
				),
				columnIds: columnList.map(col => col.id),
				player1: { num: player1.num },
				player2: { num: player2.num }
        	};
			
			const bestColumnId = await new Promise<string>((resolve, reject) => {
				if (!aiWorker || !gameActive) {
					reject('Worker not available or game not active');
					return;
				}

				const timeout = setTimeout(() => {
					reject('AI timeout');
				}, 5000);

				aiWorker.onmessage = (e) => {
					clearTimeout(timeout);
					resolve(e.data);
				};

				aiWorker.onerror = () => {
					clearTimeout(timeout);
					reject('Worker error');
				};

				aiWorker.postMessage({ 
					boardState,
					depth: 5
				});
			}).catch(error => {
				console.warn('AI Worker error:', error);
				return columnList[Math.floor(Math.random() * columnList.length)].id;
			});
			columnToUse = columnList.find(col => col.id === bestColumnId) || null;
		}

		if (columnToUse && !isColumnPlayable(columnToUse))
			columnToUse = columnList.find((column) => isColumnPlayable(column)) || null;

		return columnToUse;
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

	async function saveGameState(mode: "classic" | "custom") {
		const boardData: { [columnId: string]: number[] } = {};

		columnList.forEach(column => {
			const copy = boardMap.get(column.id);
			if (copy) boardData[column.id] = [...copy];
		});

		const state: GameState = {
			mode,
			boardData,
			player1: getPlayerState(player1),
			player2: getPlayerState(player2),
		};

		localStorage.setItem(`connect4GameStateclassic`, JSON.stringify(state));
	}

	function loadGameState(): GameState | null {
		const stateStr = localStorage.getItem(`connect4GameStateclassic`);
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
		
			await disableClicks();
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
				await enableClicks();
				return ;
			})
		
			document.getElementById('exit')?.addEventListener('click', () => {
				clearGame();
				navigateTo("/games");
			})
	})

	window.addEventListener('beforeunload', () => {
		clearGame();
	});

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