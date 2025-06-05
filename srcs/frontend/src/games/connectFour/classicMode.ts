import {
	Player,
    columnMap,
    columnList,
    boardMap,
	columnClickHandlers,
	pauseGame,
	delay,
	implementAlias,
	saveGameState,
    loadGameState,
	getDataSate,
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
	updateData,
} from './gameEngine.js';

import { sendRequest } from "../../login-page/login-fetch.js";
import { GameInfo } from "../../types.js";
import { navigateTo } from "../../index.js";
import { getTranslation } from '../../functionalities/transcript.js';

export function classicMode(data: GameInfo): void {
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
	let player2 = new PlayerClass(data.game_mode === "ai" ? true : false, 2, "yellow");

	let gameActive: boolean = true;
	let aiIsThinking: boolean = false;
	let aiWorker: Worker | null = null;
	let aiColumn: HTMLElement | null = null;
	let aiInterval: NodeJS.Timeout | number |  null = null;
	

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
			if (!gameActive) return;
			
			if (!aiColumn && player2.turn && player2.AI && !aiIsThinking && gameActive) {
				console.log("AI is thinking...");
				aiIsThinking = true;
				await disableClicks();
				aiColumn = await aiToken();
				console.log("AI chose: ", aiColumn?.id);
			}
			
			if (player2.turn && player2.AI && aiColumn && aiIsThinking && gameActive) {
				await enableClicks();
				await aiColumn.click();
				if (aiIsThinking && !aiColumn) aiIsThinking = false;
			}
		}, 1000);
	}

	function checkState(): boolean {
		if (!checkWin(false) && !checkDraw()) return false;
		if (checkWin(false)) insertDivWinner();
		else if (checkDraw()) insertDivDraw();
		disableClicks();

		const boardEl = document.getElementById('board');
    	if (boardEl) boardEl.style.animation = "mediumOpacity 0.25s ease forwards";

		const pauseBtn = document.getElementById('pauseGame')
		if (pauseBtn) pauseBtn.style.display = 'none';

		const exitBtn = document.getElementById('exitGame')
		if (exitBtn) exitBtn.style.display = 'none';

		updateData(data, player1, player2);
		saveGameState("classic", player1, player2, data);
		return true;
	}

	async function start(): Promise<void> {
		const savedState = loadGameState("classic");
		init();
		if (savedState){
			getDataSate(savedState, data);
            implementAlias(data);
			renderBoardFromState(savedState, player1, player2)
			if (player2.AI)
				initAI();
			gameActive = false;
            if (!checkState()) await pauseGame();
		}
		else{
            implementAlias(data);
            await enableClicks();
			saveGameState("classic", player1, player2, data)
        }
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
		aiIsThinking = false;
	}

	async function enableClicks(): Promise<void> {
		await enableClicksEngine(columnList);
	}

	async function disableClicks(): Promise<void> {
		await disableClicksEngine(columnList);
	}

	async function handleColumnClick(column: HTMLElement): Promise<void> {
		await disableClicks();

		if (!gameActive || player1.winner || player2.winner) {
			clearGame();
			return;
		}

		if (player2.turn && player1.AI && !aiColumn) return ;
        if (player2.turn && player2.AI && aiColumn){
            column = aiColumn;
            aiColumn = null;
        }

		await placeToken(column);
		await saveGameState("classic", player1, player2, data);

		if (checkState()) gameActive = false;
		await enableClicks();
	}
	
	function insertDivWinner(): void {
		insertDivWinnerEngine(data, player1, player2, columnList);
	}

	function insertDivDraw(): void {
		insertDivDrawEngine(columnList);
	}

	async function placeToken(column: HTMLElement | null): Promise<void> {
		await placeTokenEngine(column, player1, player2, columnMap, boardMap, columnList, "classic");
		if (aiIsThinking && player1.turn && player2.AI) aiIsThinking = false;
	}

	function checkDraw(): boolean {
		return checkDrawEngine(boardMap, columnList);
	}

	function checkWin(checking: boolean): boolean {
		return checkWinEngine(boardMap, columnList, player1, player2, checking);
	}

	async function aiToken(): Promise<HTMLElement | null> {
		if (!gameActive || !aiWorker || !player2.turn || aiColumn) return null;

		const winColumns = detectWinOpportunities(player2);
		if (winColumns.length > 0) {
			return winColumns[0];
		}

		const threatColumns = detectWinOpportunities(player1);
		if (threatColumns.length > 0) {
			return threatColumns[0];
		}

		let columnToUse: HTMLElement | null = Math.random() < 0.3 ? 
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
					reject(getTranslation('game_no_worker'));
					return;
				}

				const timeout = setTimeout(() => {
					reject(getTranslation('game_ai_timeout'));
				}, 5000);

				aiWorker.onmessage = (e) => {
					clearTimeout(timeout);
					resolve(e.data);
				};

				aiWorker.onerror = () => {
					clearTimeout(timeout);
					reject(getTranslation('game_worker_error'));
				};

				aiWorker.postMessage({ 
					boardState,
					depth: 5
				});
			}).catch(error => {
				console.warn(getTranslation('game_ai_error'), error);
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
		await pauseGame();
	})

	document.getElementById('exit-end')?.addEventListener('click', async () => {
        clearGame();
		localStorage.removeItem(`connect4GameStateclassic`);
		try {
			const response = await sendRequest('POST', '/matches/istournamentmatch', {match_id: data.match_id})
			if (response)
				navigateTo("/tournament");
			else
				navigateTo("/games");
		}
		catch (error) {
			console.error(error);
		}
    });

	document.getElementById('draw-end')?.addEventListener('click', async () => {
        clearGame();
		localStorage.removeItem(`connect4GameStateclassic`);
		try {
			const response = await sendRequest('POST', '/matches/istournamentmatch', {match_id: data.match_id})
			if (response)
				navigateTo("/tournament");
			else
				navigateTo("/games");
		}
		catch (error) {
			console.error(error);
		}
    });
	
	document.getElementById('exitGame')?.addEventListener('click', async () => {
		const exitBtn = document.getElementById('exitGame');
		if (!exitBtn){
			console.error(getTranslation('game_no_exitGame'));
			return Promise.resolve();
		}
	
		const pauseBtn = document.getElementById('pauseGame')
		if (!pauseBtn){
			console.error(getTranslation('game_no_pauseGame'))
			return Promise.resolve();
		}
	
		const boardEl = document.getElementById('board');
		if (!boardEl){
			console.error(getTranslation('game_no_boardElement'))
			return Promise.resolve();
		}
	
		const diceEl = document.getElementById('dice-container');
		if (!diceEl){
			console.error(getTranslation('game_no_dice'))
			return Promise.resolve();
		}
	
		const surrenderPl2 = document.getElementById('surrenderPl2');
        if (!surrenderPl2){
            console.error(getTranslation('game_no_surrender'));
            return Promise.resolve();
        }
        if (player2.AI) surrenderPl2.style.display = 'none';
		
		await disableClicks();
		diceEl.style.pointerEvents = 'none';
		exitBtn.style.pointerEvents = 'none';
		pauseBtn.style.pointerEvents = 'none';
		boardEl.style.animation = "mediumOpacity 0.25s ease forwards";
		gameActive = false;
		await delay(250);
	
		const returnEl = document.getElementById('returnToGamesConnect');
		if (!returnEl){
			console.error(getTranslation('game_return_connect'));
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
	
		document.getElementById('surrenderPl1')?.addEventListener('click', async () => {
			player2.winner = true;
			player1.winner = false;
			await updateData(data, player1, player2);
			clearGame();
			localStorage.removeItem(`connect4GameStateclassic`);
			try {
				const response = await sendRequest('POST', '/matches/istournamentmatch', {match_id: data.match_id})
				if (response)
					navigateTo("/tournament");
				else
					navigateTo("/games");
			}
			catch (error) {
				console.error(error);
			}
		})

		document.getElementById('surrenderPl2')?.addEventListener('click', async () => {
			player1.winner = true;
			player2.winner = false;
			await updateData(data, player1, player2);
			clearGame();
			localStorage.removeItem(`connect4GameStateclassic`);
			try {
				const response = await sendRequest('POST', '/matches/istournamentmatch', {match_id: data.match_id})
				if (response)
					navigateTo("/tournament");
				else
					navigateTo("/games");
			}
			catch (error) {
				console.error(error);
			}
		})
	})

	start();
}