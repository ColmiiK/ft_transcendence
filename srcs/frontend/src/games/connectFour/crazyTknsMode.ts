import {
    Player,
    columnMap,
    columnList,
    boardMap,
    columnClickHandlers,
    crazyTokens,
    pauseGame,
    saveGameState,
    loadGameState,
    updateDice,
    updateData,
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
    updateTurnIndicator as updateTurnIndicatorEngine,
    isColumnPlayable as isColumnPlayableEngine,
    detectWinOpportunities as detectWinOpportunitiesEngine,
    delay as delayEngine,
} from './gameEngine.js';

import { GameInfo } from "../../types.js";
import { navigateTo } from "../../index.js";
import { updateDescription } from '../../modify-profile/modify-fetch.js';

export function crazyTokensMode(data: GameInfo): void {
    class PlayerClass {
        color: string;
		turn: boolean = false;
		winner: boolean = false;
		num: number;
		AI: boolean;
        count: number = 0;
		specialToken: string | null = null;
		useSpecial: boolean = false;
		affected: string | null = null;
		turnAffected: number = 0;
		diceUses: number = 3;
        constructor(AI: boolean, num: number, color: string) {
            this.AI = AI;
            this.num = num;
            this.color = color;
        }
    }
	let player1 = new PlayerClass(false, 1, "red");
	let player2 = new PlayerClass(data.game_mode === "ai-custom" ? true : false, 2, "yellow");

    let gameActive: boolean = true;
	let aiIsThinking: boolean = false;
	let aiWorker: Worker | null = null;
	let aiColumn: HTMLElement | null = null;
	let aiInterval: NodeJS.Timeout | null = null;

    /* Initialization Functionality */

    function init(): void {
        const dice = document.getElementById("dice-container");
        if (!dice) return ;
        dice.style.display = 'flex';

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
            if (!gameActive) return ;
			if (player2.turn && player2.AI && !aiColumn && !aiIsThinking && gameActive) {
				console.log("AI is thinking...");
                aiIsThinking = true;
                await disableClicks();
				aiColumn = await aiToken();
				console.log("AI chose: ", aiColumn?.id);
			}
			else if (player2.turn && player2.AI && aiColumn && aiIsThinking && gameActive) {
                await enableClicks();
                await aiColumn.click();
                if (aiIsThinking && !aiColumn) aiIsThinking = false;
			}
		}, 1000);
	}

    function checkState(): boolean {
		if (!checkWin(false) && !checkDraw()) return false;
		if (checkWin(false)){
			insertDivWinner();
			disableClicks();
		}
		else if (checkDraw()){
			insertDivDraw();
			disableClicks();
		}
		const pauseBtn = document.getElementById('pauseGame')
		if (pauseBtn) pauseBtn.style.display = 'none';

        const exitBtn = document.getElementById('exitGame')
		if (exitBtn) exitBtn.style.display = 'none';

        updateData(data, player1, player2)
		return true;
	}

    async function start(): Promise<void> {
        const savedState = loadGameState("custom");
		init();
		if (savedState){
			renderBoardFromState(savedState, player1, player2)
			if (player2.AI)
				initAI();
			gameActive = false;
            if (!checkState()) await pauseGame();
		}
		else await enableClicks();
		handlerEvents();
        saveGameState("custom", player1, player2)
    }

    function handlerEvents(){
        document.getElementById("dice-container")!.removeEventListener("click", rollDice);
        document.getElementById("dice-container")!.addEventListener("click", () => rollDice());

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

    function resetPlayer(): void {
        player1.affected = null;
        player1.count = 0;
        player1.specialToken = null;
        player1.useSpecial = false;
        player1.turnAffected = 0;
        player1.diceUses = 3;
        player2.affected = null;
        player2.count = 0;
        player2.specialToken = null;
        player2.useSpecial = false;
        player2.turnAffected = 0;
        player2.diceUses = 3;
    }

    function clearGame(): void {
        localStorage.removeItem(`connect4GameStatecustom`);
        gameActive = false;
        clearGameEngine(player1, player2, columnList, columnMap, boardMap);
        resetPlayer();

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

    /* Click Functionality */

    async function enableClicks(): Promise<void> {
        await enableClicksEngine(columnList);
    }
    
    async function disableClicks(): Promise<void> {
        await disableClicksEngine(columnList);
    }

    /* Handle Column Click */

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

        const currentPlayer = player1.turn ? player1 : player2;

        if (currentPlayer.affected && currentPlayer.affected != "🎲" && currentPlayer.turnAffected > 0){
            if (currentPlayer.turnAffected > 1) currentPlayer.turnAffected--;
            else await disableEffects(currentPlayer);
        }

        if (currentPlayer.useSpecial && currentPlayer.affected === "🎲"){
            const randomColumn = columnList[Math.floor(Math.random() * columnList.length)];
            await placeSpecialToken(randomColumn);
            await disableEffects(currentPlayer);
        }
        else if (currentPlayer.useSpecial) 
            await placeSpecialToken(column)
        else if (currentPlayer.affected && currentPlayer.affected === "🎲"){
            const randomColumn = columnList[Math.floor(Math.random() * columnList.length)];
            await placeToken(randomColumn);
            await disableEffects(currentPlayer);
        }
        else 
            await placeToken(column);

        await saveGameState("custom", player1, player2);

        if (checkState()) gameActive = false

        await enableClicks();
    }

    /* Insert Div Win / Draw */

    function insertDivWinner(): void {
        document.getElementById("dice-container")!.style.pointerEvents = 'none';
        insertDivWinnerEngine(player1, player2, columnList);
    }

    function insertDivDraw(): void {
        document.getElementById("dice-container")!.style.pointerEvents = 'none';
        insertDivDrawEngine(columnList);
    }

    /* Turn Indicator */

    async function updateTurnIndicator(): Promise<void> {
        await updateTurnIndicatorEngine(player1, player2, columnList, columnMap, "crazy");
    }
      
    /* Place Token Functionality */

    async function placeToken(column: HTMLElement): Promise<void> {
        await placeTokenEngine(column, player1, player2, columnMap, boardMap, columnList, "crazy");
        if (aiIsThinking && player1.turn && player2.AI) aiIsThinking = false;
    }

    /* Check Win / Draw */

	function checkDraw(): boolean {
		return checkDrawEngine(boardMap, columnList);
	}

	function checkWin(checking: boolean): boolean {
		return checkWinEngine(boardMap, columnList, player1, player2, checking);
	}

    /* AI Functionality */

    async function aiToken(): Promise<HTMLElement | null> {
        if (!gameActive || !aiWorker || !player2.turn || aiColumn) return null;

		if (player2.affected && player2.affected === "🌫️"){
			console.log("AI is blind");
            const randomCol = columnList[Math.floor(Math.random() * columnList.length)];
            return isColumnPlayable(randomCol) ? randomCol : 
               columnList.find(col => isColumnPlayable(col)) || null;
		}

        const winColumns = detectWinOpportunities(player2);
        if (winColumns.length > 0 && winColumns[0]) return winColumns[0];

        const	threatColumns = detectWinOpportunities(player1);
        let columnToUse: HTMLElement | null = await controlUseDice(threatColumns);

        if (columnToUse) return columnToUse ;

        if (threatColumns.length > 0) return threatColumns[0];

		if (Math.random() < 0.3) {
            const playableColumns = columnList.filter(col => isColumnPlayable(col));
            if (playableColumns.length > 0)
                return playableColumns[Math.floor(Math.random() * playableColumns.length)];
        }

        if (!columnToUse && aiWorker){
            try {
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
            } catch (error) {
                console.warn('AI Worker failed, using fallback:', error);
                const playableColumns = columnList.filter(col => isColumnPlayable(col));
                columnToUse = playableColumns.length > 0 ? 
                         playableColumns[Math.floor(Math.random() * playableColumns.length)] : null;
            }
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

	/* Special Tokens AI Functionality */

	function countTokens(playerNum: number): number {
		let count = 0;

		columnList.forEach((column: HTMLElement) => {
			const columnData = boardMap.get(column.id);
			if (!columnData) return;

			count += columnData.filter(v => v === playerNum).length;
		});
		return count;
	}

    function shouldUseSpecialToken(token: string, blockNeeded: boolean, boardFilledRatio: number): boolean {
        const	playerTokens = countTokens(player2.num);
    	const	opponentTokens = countTokens(player1.num);

		switch (token) {
           case "💣":
                return boardFilledRatio >= 0.5;
            case "🔒":
                return blockNeeded;
             case "👻":
                return boardFilledRatio >= 0.5;
            case "🌫️":
            	return blockNeeded || opponentTokens > playerTokens + 4;
			case "🌀":
            	return opponentTokens > playerTokens && boardFilledRatio > 0.35;
            case "🎲":
                return blockNeeded || opponentTokens > playerTokens + 4;
            default:
                return false;
        }
    }

	function chooseBestColumn(token: string): HTMLElement | null {
		let bestCol = null;
		let maxEnemyTokens = 0;

		if (token === "👻") {
			bestCol = columnList[Math.floor(columnList.length / 2)];
			if (isColumnPlayable(bestCol)) return bestCol;
			bestCol = null;
		}

		columnList.forEach((column: HTMLElement) => {
			if (!isColumnPlayable(column)) return ;

			const columnData = boardMap.get(column.id);
			if (!columnData) return;
			const enemyCount = columnData.filter(v => v === player1.num).length;
			if (enemyCount > maxEnemyTokens) {
				maxEnemyTokens = enemyCount;
				bestCol = column;
			}
		});
		return bestCol;
	}

    function chooseBestColumnForToken(token: string, threats: HTMLElement[]): HTMLElement | null {
        switch (token) {
            case "🔒":
                return threats.length > 0 ? threats[0] : null;
            case "💣": 
                return chooseBestColumn("💣");
            case "👻":
				return chooseBestColumn("👻");
            default:
                return null;
        }
    }

    async function controlUseDice(threatColumns: HTMLElement[]): Promise<HTMLElement | null> {
		let		columnToUse: Promise<HTMLElement | null> = Promise.resolve(null);
		const	blockNeeded = threatColumns.length > 0;
        const   diceDiv = document.getElementById("dice-container");
        const	needSpecialToken = blockNeeded || Math.random() < 0.5;

        if (!player2.specialToken && player2.diceUses > 0 && needSpecialToken && diceDiv) await diceDiv.click();
        await delay(500);

        const   totalCells = columnList.length * 6;
        const	filledCells = Array.from(document.getElementsByClassName("filled")).length;
        const   boardFilledRatio = filledCells / totalCells;
		const   shouldUseSpecial = player2.specialToken ? 
			shouldUseSpecialToken(player2.specialToken, blockNeeded, boardFilledRatio) : false;

		if (shouldUseSpecial && player2.specialToken && diceDiv) {
			await diceDiv.click();
            await delay(500);
			let specialColumn = chooseBestColumnForToken(player2.specialToken, threatColumns);
			if (specialColumn) 
				columnToUse = Promise.resolve(Math.random () < 0.2 ? 
					columnList[Math.floor(Math.random() * columnList.length)] : specialColumn);
			player2.useSpecial = true;
		}
		return columnToUse;
	}

    /* Special Tokens Functionality */

    async function rollDice(): Promise<void> {
        const currentPlayer = player1.turn ? player1 : player2;
        
        const diceContainer = document.getElementById("dice-container");
        const diceIcon = document.getElementById("dice-icon");
		if (!diceContainer || !diceIcon) return;
    
        if (currentPlayer.diceUses <= 0 && !currentPlayer.specialToken) {
            diceIcon.innerText = "❌";
            return;
        }

        if (currentPlayer.specialToken) {
            currentPlayer.useSpecial = true;
            diceContainer.classList.add("usingDice");
            await delay(1000);
            diceContainer.classList.remove("usingDice");
            diceContainer.style.pointerEvents = 'none'
            return ;
        }

        diceContainer.classList.add("rolling");
        await delay(1000);
        const randomIndex = Math.floor(Math.random() * crazyTokens.length);
        const newToken = crazyTokens[randomIndex];
        
        diceIcon.innerText = newToken;
        currentPlayer.specialToken = newToken;
        currentPlayer.diceUses--;

        diceContainer.classList.remove("rolling");
        saveGameState("custom", player1, player2);
    }

    /* Disable Effects */

    async function disableLock(): Promise<void> {
        columnList.forEach((column: HTMLElement) => {
            column.classList.remove("opacity-50");
            column.style.pointerEvents = "auto";
        });

        let tokens = Array.from(document.getElementsByClassName("lockToken"));
        tokens.forEach((token) => {
            (token as HTMLElement).innerText = "";
            (token as HTMLElement).classList.remove("lockToken");
        });
    }

    async function disableBlind(): Promise<void> {
        let tokens = Array.from(document.getElementsByClassName("token"));
        
        tokens.forEach((token) => {
            (token as HTMLElement).style.backgroundColor = token.classList.contains("red") ? "red" : "yellow";
            (token as HTMLElement).innerText = "";
        });

        let blind = Array.from(document.getElementsByClassName("blindToken"))
        blind.forEach((tkn) => {
            (tkn as HTMLElement).classList.remove("blindToken")
        })
    }

    async function disableGhost(): Promise<void> {
        let tokens = Array.from(document.getElementsByClassName("ghostToken"));
        
        for (const token of tokens) {
            if (!token.parentElement || !token.parentElement.parentElement) continue;
            const columnId = token.parentElement.parentElement.id;
            
            const columnData = boardMap.get(columnId);
            if (!columnData) continue;
            
            const columnCells = columnMap.get(columnId);
            if (!columnCells) continue;
            
            const row = Array.from(columnCells).indexOf(document.getElementById(token.parentElement.id) as HTMLElement);
            if (row !== -1)
                columnData[row] = 0;
    
            token.parentElement.className = `cell ${player1.turn ?
                `red-hover` : `yellow-hover`}`;
            token.remove();
            await updateBoard(columnId);
        }
    }

    async function disableDice(): Promise<void> {
        let tokens = Array.from(document.getElementsByClassName("diceToken"));
        tokens.forEach((token) => {
            (token as HTMLElement).innerText = "";
            (token as HTMLElement).classList.remove("diceToken");
        });
    }

    async function disableEffects(currentPlayer: Player): Promise<void> {
        switch (currentPlayer.affected) {
            case "🔒":
                await disableLock();
                break;
            case "🌫️":
                await disableBlind();
                break;
            case "👻":
                await disableGhost();
                break;
            case "🎲":
                await disableDice();
                break;
        }
        currentPlayer.affected = null;
        currentPlayer.turnAffected = 0;
    }

    /* Handle Special Effects */

    async function updateBoard(colId: string): Promise<void> {
        const columnData = boardMap.get(colId);
        const cells = columnMap.get(colId);
        if (!columnData || !cells) return;

        for (let row = 0; row < columnData.length; row++) {
            if (columnData[row] !== 0) {
                const emptyCell = columnData.findIndex(cell => cell === 0);
                if (emptyCell === -1) break ;
                if (emptyCell >= row) continue ;

                columnData[emptyCell] = columnData[row] === 1 ? 1 : 2;
                columnData[row] = 0;

                if (cells[row]?.hasChildNodes()) {
                    const token = cells[row].firstChild as HTMLElement | null;
                    if (token) {
                        const currentPlayer = player1.turn ? player1 : player2;
                        
                        cells[emptyCell].className = "filled";
                        token.style.position = 'absolute';
                        token.style.animation = 'moveToken 0.2 ease-in forwards';

                        await delay(200);

                        cells[row].removeChild(token);
                        cells[emptyCell].appendChild(token);

                        if (currentPlayer.color === "red")
                            cells[row].className = "cell red-hover";
                        else if (currentPlayer.color === "yellow")
                            cells[row].className = "cell yellow-hover";
                        token.style.animation = '';
                    }
                }
            }
        }
        await delay(250);
    }

    function handleReverse(): void{
        for (let col = 0; col < columnList.length; col++) {
            const columnId = columnList[col].id;
            const columnData = boardMap.get(columnId);
			if (!columnData) continue;

            for (let row = 0; row < columnData.length; row++) {
                if (columnData[row] == 1) columnData[row] = 2;
                else if (columnData[row] == 2) columnData[row] = 1;
            }
        }

        let tokens = Array.from(document.getElementsByClassName("token"))
        tokens.forEach(token => {
			if (token.classList.contains("red")) {
                token.classList.remove("red");
                token.classList.add("yellow");
            } 
            else if (token.classList.contains("yellow")) {
                token.classList.remove("yellow");
                token.classList.add("red");
            }
            (token as HTMLElement).innerText = "";
		})

        player1.color === "red" ? player1.color = "yellow" : player1.color = "red";
        player2.color === "yellow" ? player2.color = "red" : player2.color = "yellow";
        player1.num === 1 ? player1.num = 2 : player1.num = 1;
        player2.num === 2 ? player2.num = 1 : player2.num = 2;
    }

    async function handleBlind(player: Player): Promise<void> {
        const opponent = player === player1 ? player2 : player1;
        opponent.affected = player === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;

        let tokens = Array.from(document.getElementsByClassName("token"));
        tokens.forEach(token => {
            (token as HTMLElement).style.backgroundColor = "gray";
        });
      } 

    async function handleBomb(row: number, columnId: string): Promise<void> {
        const colIndex = columnList.findIndex(col => col.id === columnId);
      
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = 1; dy >= -1; dy--) {
            const newCol = colIndex + dx;
            const newRow = row + dy;
      
            if (newCol >= 0 && newCol < columnList.length && newRow >= 0 && newRow < 6) {
                const col = columnList[newCol];
                const columnCells = columnMap.get(col.id);
                const columnData = boardMap.get(col.id);

                if (columnCells && columnData) {
                    const cell = columnCells[newRow];
                    const currentPlayer = player1.turn ? player1 : player2;

                    cell.style.transition = 'background-color 0.3s';
                    cell.style.backgroundColor = '#ff000088';
                    await delay(200);
                    columnData[newRow] = 0;
                    cell.innerHTML = "";
                    cell.style.backgroundColor = "";

                    if (currentPlayer.color === "red")
                        cell.classList.add("red-hover");
                    else if (currentPlayer.color === "yellow")
                        cell.classList.add("yellow-hover");
                    await updateBoard(col.id);
                }
            }
          }
        }
        await delay(300);
    }

    async function handleLock(column: HTMLElement, player: Player): Promise<void> {
        const opponent = player === player1 ? player2 : player1;
        opponent.affected = player === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
        column.classList.add("opacity-50");
        column.style.pointerEvents = "none";
        await delay(500);
    } 

	
    async function handleGhost(): Promise<void> {
        const opponent = player1.turn ? player2 : player1;
        const currentPlayer = player1.turn ? player1 : player2;

        player1.turn = !player1.turn;
        player2.turn = !player2.turn;
        opponent.affected = currentPlayer === player1 ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 2;
    } 

	async function handleDice(): Promise<void> {
		const opponent = player1.turn ? player2 : player1;
        opponent.affected = player1.turn ? player1.specialToken : player2.specialToken;
        opponent.turnAffected = 1;
	}

    async function handleSpecialToken(row: number, player: Player, column: HTMLElement): Promise<void> {
        switch (player.specialToken) {
            case "🌀":
                await handleReverse();
                break;
            case "🌫️":
                await handleBlind(player);
                break;
            case "💣":
                await handleBomb(row, column.id);
                break;
            case "🔒":
                await handleLock(column, player);
                break;
            case "👻":
                await handleGhost();
                break;
            case "🎲":
                await handleDice();
                break;
          default:
            break;
        }
        document.getElementById("dice-container")!.style.pointerEvents = 'auto';
    }

    /* Place Special Token */

    async function updateSpecialCell(cell: HTMLElement, player: Player): Promise<void> {
        const token = document.createElement("div");

        token.className = `token ${player.color}`;
        if (player.specialToken === "👻")
            token.classList.add("ghostToken");
        if (player.specialToken === "🎲")
            token.classList.add("diceToken")
        if (player.specialToken === "🔒")
            token.classList.add("lockToken")
        if (player.specialToken === "🌫️")
            token.classList.add("blindToken")
        
        token.innerText = `${player.specialToken}`;
        token.style.animation = "token 0.5s ease-in forwards";
        cell.className = "filled";
        cell.appendChild(token);
        await delay(1000);
    }

    async function placeSpecialToken(column: HTMLElement): Promise<void> {
        await disableClicks();

        const currentPlayer = player1.turn ? player1 : player2;
        
        const cells = columnMap.get(column.id);
        const columnData = boardMap.get(column.id);
		if (!cells || !columnData) {
            await enableClicks();
            return;
        }

        const row = columnData.findIndex(cell => cell === 0);
        if (row === -1) {
            await enableClicks();
            return;
        }
        
        if (currentPlayer.specialToken === "👻")
            columnData[row] = 3;
        else
            columnData[row] = currentPlayer.num;

        await updateSpecialCell(cells[row], currentPlayer);
        document.getElementById("board")!.style.pointerEvents = 'none';
        await handleSpecialToken(row, currentPlayer, column);
        document.getElementById("board")!.style.pointerEvents = 'auto';

        currentPlayer.specialToken = null;
        currentPlayer.useSpecial = false;
        if (columnData[row] == 3)
            updateDice(player1, player2);
        await updateTurnIndicator();
        if (aiIsThinking && player2.AI) aiIsThinking = false;
        await delay(100);
        await enableClicks();
    }

    /* Utils */

	async function delay(ms: number): Promise<void> {
		await delayEngine(ms);
	}

    /* Pause and Exit */

    document.getElementById('pauseGame')?.addEventListener('click', async () => {
        gameActive = gameActive ? false : true;
        await pauseGame();
    })

	document.getElementById('exit-end')?.addEventListener('click', async () => {
        clearGame();
        navigateTo("/games");
    });

	document.getElementById('draw-end')?.addEventListener('click', async () => {
        clearGame();
        navigateTo("/games");
    });

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
            gameActive = true;
            await enableClicks();
            return ;
        })
    
        document.getElementById('exit')?.addEventListener('click', async () => {
            clearGame();
            await updateData(data, player1, player2);
            navigateTo("/games");
        })
	})

    
    
    start();
}
