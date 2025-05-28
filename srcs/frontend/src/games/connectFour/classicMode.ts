import {
	Player,
    columnMap,
    columnList,
    boardMap,
	columnClickHandlers,
	pauseGame,
	delay,
	saveGameState,
    loadGameState,
    renderBoardFromState,
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
				console.log("AI is thinking...");
				aiColumn = await aiToken();
				console.log("AI chose: ", aiColumn?.id);
			}
			
			if (player2.turn && player2.AI && aiColumn && aiIsThinking) {
				await aiColumn.click();
				aiIsThinking = false;
				aiColumn = null;
			}
		}, 1000);
	}

	async function start(): Promise<void> {
		const savedState = loadGameState("classic");
		init();
		if (savedState){
			renderBoardFromState(savedState, player1, player2)
			if (player2.AI)
				initAI();
			gameActive = false;
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

		if (player2.turn && player2.AI && !aiColumn) return ;
		else if (player2.turn && player2.AI && aiColumn) { column = aiColumn; }

		await placeToken(column);
		await saveGameState("classic", player1, player2);

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

		let columnToUse: HTMLElement | null = Math.random() < 0.2 ? 
			columnList[Math.floor(Math.random() * columnList.length)] : null;

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

	document.getElementById('pauseGame')?.addEventListener('click', async () => {
		gameActive = gameActive ? false : true;
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
		gameActive = false;
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
			gameActive = gameActive = true;
			await enableClicks();
			return ;
		})
	
		document.getElementById('exit')?.addEventListener('click', () => {
			clearGame();
			navigateTo("/games");
		})
	})

	start();
}