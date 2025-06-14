import { 
    Player, GeneralData, PaddleCollision, BallData, AIData, OnresizeData, init, 
	resetBall, updateScore, setAI, countDown, pauseGame, returnToGames, checkLost,
	implementAlias, exitGame, play as playEngine, moveBall as moveBallEngine,
} from './gameEngine.js';

import { GameInfo } from "../../types.js";
import { checkLogged } from '../../index.js';
import { getTranslation } from '../../functionalities/transcript.js';

export function classicPong(data: GameInfo): void{
	const gameElement = document.getElementById('game');
	if (!gameElement){
		throw new Error(getTranslation('game_not_found'));
	}
	let width = gameElement.clientWidth;
	let height = gameElement.clientHeight;

	const player1: Player = {
        keyPress: false,
        keyCode: null,
        paddle: document.getElementById('paddleLeft') as HTMLElement,
        paddleCenter: 0,
        counter: 0,
        paddleSpeed: 0.04
    };
    
    const player2: Player = {
        keyPress: false,
        keyCode: null,
        paddle: document.getElementById('paddleRight') as HTMLElement,
        paddleCenter: 0,
        counter: 0,
        paddleSpeed: 0.04
    };
    
    const generalData: GeneralData = {
        time: 30,
        speed: 0.02,
        paddleMargin: height * 0.03,
        controlGame: null,
		isPaused: false,
		exitPause: false,
    };

    const paddleCollisionData: PaddleCollision = {
        offset: 0,
        maxBounceAngle: 0,
        newVelX: 0
    };

    const ballData: BallData = {
        ball: document.getElementById('ball') as HTMLElement,
        velX: 0,
        velY: 0,
        angle: 0,
        ballCenter: 0
    };

    const AIData: AIData = {
        timeToRefresh: 1000,
        targetY: 0,
        timeToReach: 0,
        errorRate: 0,
        activate: data.game_mode === "ai" ? true : false,
        controlAI: null
    };

    const onresizeData: OnresizeData = {
        ballRelativeLeft: 0,
        ballRelativeTop: 0,
        player1RelativeTop: 0,
        player2RelativeTop: 0,
        newSpeed: 0
    };

	async function start(): Promise<void> {
		const savedState = localStorage.getItem("gameStateclassic");
		if (savedState){
			loadGameState();
			implementAlias(data);
			manageTouchPad();
			saveGameState();
			if (!checkLost(generalData, ballData, AIData, null, data, player1, player2, width))
				await pauseGame(generalData, ballData, null);
		}
		if (!savedState){
			implementAlias(data);
			manageTouchPad();
			await countDown(ballData, true);
			init(generalData, ballData, player1, player2, width);
			saveGameState();
		}
		generalData.controlGame = setInterval(play, generalData.time);
		if (AIData.activate) 
			AIData.controlAI = setInterval(moveAI, AIData.timeToRefresh);
	}

	function play(): void {
		if (generalData.isPaused || generalData.exitPause) return ;

		setOnresize();
		moveBall();
		playEngine(generalData, ballData, AIData, player1, player2, width, height, null, data);
		saveGameState();
	}

	function moveBall(){
		moveBallEngine(ballData, player1, player2, paddleCollisionData, generalData, width, height)
	}

	function moveAI(): void {
		if (generalData.isPaused || generalData.exitPause) return ;

		let random = Math.random();
		setAI(AIData, player2, ballData, height);

		AIData.targetY = random < 0.03 ? AIData.errorRate : AIData.targetY;

		while (AIData.targetY < 0 || AIData.targetY > height)
			AIData.targetY = AIData.targetY < 0 ? AIData.targetY * -1 : 2 * height - AIData.targetY;

		if (player2.paddleCenter < AIData.targetY) {
			player2.keyCode = "down";
			player2.keyPress = true;
		} else if (player2.paddleCenter > AIData.targetY) {
			player2.keyCode = "up";
			player2.keyPress = true;
		}
	}

	document.onkeydown = function(e: KeyboardEvent): void {
		const key = e.key.toLowerCase();
		if (key === "w") {
			player1.keyPress = true; 
			player1.keyCode = "up";
		}
		if (key === "s") {
			player1.keyPress = true; 
			player1.keyCode = "down";
		}
		if (key === "arrowup" && !AIData.activate) {
			player2.keyPress = true; 
			player2.keyCode = "up";
		}
		if (key === "arrowdown" && !AIData.activate) {
			player2.keyPress = true; 
			player2.keyCode = "down";
		}
	}

	document.onkeyup = function(e: KeyboardEvent): void {
		const key = e.key.toLowerCase();
		if (key === "w" || key === "s") 
			player1.keyPress = false;
		if (key === "arrowup" || key === "arrowdown") 
			player2.keyPress = false;
	}

	function setupButtonControls() {
		const btnPl1Up = document.getElementById("btnPl1Up");
		const btnPl1Down = document.getElementById("btnPl1Down");

		btnPl1Up?.addEventListener("touchstart", () => {
			player1.keyCode = "up";
			player1.keyPress = true;
		});

		btnPl1Down?.addEventListener("touchstart", () => {
			player1.keyCode = "down";
			player1.keyPress = true;
		});

		const stopPl1 = () => { player1.keyPress = false; };

		btnPl1Up?.addEventListener("touchend", stopPl1);
		btnPl1Down?.addEventListener("touchend", stopPl1);

		if (!AIData.activate) {
			const btnPl2Up = document.getElementById("btnPl2Up");
			const btnPl2Down = document.getElementById("btnPl2Down");

			btnPl2Up?.addEventListener("touchstart", () => {
				player2.keyCode = "up";
				player2.keyPress = true;
			});

			btnPl2Down?.addEventListener("touchstart", () => {
				player2.keyCode = "down";
				player2.keyPress = true;
			});

			const stopPl2 = () => { player2.keyPress = false; };

			btnPl2Up?.addEventListener("touchend", stopPl2);
			btnPl2Down?.addEventListener("touchend", stopPl2);
		}
	}

	function setOnresize(): void {
		onresizeData.ballRelativeLeft = ballData.ball.offsetLeft / width;
		onresizeData.ballRelativeTop = ballData.ball.offsetTop / height;
		onresizeData.player1RelativeTop = player1.paddle.offsetTop / height;
		onresizeData.player2RelativeTop = player2.paddle.offsetTop / height;

		if (gameElement){
			width = gameElement.clientWidth;
			height = gameElement.clientHeight;
		}
		generalData.paddleMargin = height * 0.03;

		onresizeData.newSpeed = 0.01;
	}

	window.onresize = function (): void {
		setOnresize();

		ballData.velX = Math.sign(ballData.velX) * width * onresizeData.newSpeed;
		ballData.velY = Math.sign(ballData.velY) * height * onresizeData.newSpeed;
	
		ballData.ball.style.left = `${onresizeData.ballRelativeLeft * width}px`;
		ballData.ball.style.top = `${onresizeData.ballRelativeTop * height}px`;

		player1.paddle.style.top = `${onresizeData.player1RelativeTop * height}px`;
		player2.paddle.style.top = `${onresizeData.player2RelativeTop * height}px`;
	
		if (ballData.ball.offsetLeft < 0) {
			updateScore(player2.paddle, player1, player2);
			resetBall(generalData, ballData, player1, player2, width);
			return;
		} else if (ballData.ball.offsetLeft + ballData.ball.clientWidth > width) {
			updateScore(player1.paddle, player1, player2);
			resetBall(generalData, ballData, player1, player2, width);
			return;
		}
	
		if (ballData.ball.offsetTop < 0) {
			ballData.ball.style.top = `0px`;
			ballData.velY = Math.abs(ballData.velY);
		} else if (ballData.ball.offsetTop + ballData.ball.clientHeight > height) {
			ballData.ball.style.top = `${height - ballData.ball.clientHeight}px`;
			ballData.velY = -Math.abs(ballData.velY);
		}
		
		manageTouchPad();
	}

	function saveGameState() {
		const gameState = {
			player1: {
				counter: player1.counter,
				paddleTop: player1.paddle.offsetTop,
				paddleSpeed: player1.paddleSpeed
			},
			player2: {
				counter: player2.counter,
				paddleTop: player2.paddle.offsetTop,
				paddleSpeed: player2.paddleSpeed
			},
			ball: {
				posX: ballData.ball.offsetLeft,
				posY: ballData.ball.offsetTop,
				velX: ballData.velX,
				velY: ballData.velY,
				angle: ballData.angle
			},
			generalData: {
				time: generalData.time,
				speed: generalData.speed,
			},
			AIData: {
				activate: AIData.activate,
				targetY: AIData.targetY
			},
			Data: {
                alias1: data.first_player_alias,
                alias2: data.second_player_alias,
                game_mode: data.game_mode,
                is_custom: data.is_custom,
                match_id: data.match_id
            }
		};
		localStorage.setItem('gameStateclassic', JSON.stringify(gameState));
	}

	function loadGameState() {
		const savedState = localStorage.getItem('gameStateclassic');

		if (savedState) {
			const gameState = JSON.parse(savedState);

			player1.counter = gameState.player1.counter;
			player2.counter = gameState.player2.counter;

			player1.paddle.style.top = `${gameState.player1.paddleTop}px`;
			player2.paddle.style.top = `${gameState.player2.paddleTop}px`;

			player1.paddleSpeed = gameState.player1.paddleSpeed;
			player2.paddleSpeed = gameState.player2.paddleSpeed;

			ballData.ball.style.left = `${gameState.ball.posX}px`;
			ballData.ball.style.top = `${gameState.ball.posY}px`;
			ballData.velX = gameState.ball.velX;
			ballData.velY = gameState.ball.velY;
			ballData.angle = gameState.ball.angle;

			generalData.time = gameState.generalData.time;
			generalData.speed = gameState.generalData.speed;

			AIData.activate = gameState.AIData.activate;
			AIData.targetY = gameState.AIData.targetY;

			data.first_player_alias = gameState.Data.alias1;
            data.second_player_alias = gameState.Data.alias2;
            data.game_mode = gameState.Data.game_mode;
            data.is_custom = gameState.Data.is_custom;
            data.match_id = gameState.Data.match_id;

			document.getElementById('counter1')!.innerText = player1.counter.toString();
			document.getElementById('counter2')!.innerText = player2.counter.toString();
		}
	}

	document.getElementById('pauseGame')?.addEventListener('click', async () => {
		await pauseGame(generalData, ballData, null);
	})

	document.getElementById('exit-end')?.addEventListener('click', async () => {
		await exitGame("classic", player1, player2, null, data)
	});

	document.getElementById('exitGame')?.addEventListener('click', async () => {
		if (checkLost(generalData, ballData, AIData, null ,data, player1, player2, width)){
			let cont = document.getElementById("continue");
			let pauseDiv = document.getElementById("pauseGame")
			if (cont) cont.style.display = "none";
			if (pauseDiv) pauseDiv.style.display = "none";
		}
		await returnToGames(generalData, ballData, AIData, player1, player2, "classic", null, data);
	});

	function isMobileDevice() {
		return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	}

	function manageTouchPad(){
		const leftControls = document.getElementById("left-controls");
		const rightControls = document.getElementById("right-controls");
		if (isMobileDevice()) {
			if (leftControls) leftControls.style.display = "flex";
			if (!AIData.activate && rightControls)
				rightControls.style.display = "flex";
			else if (AIData.activate && rightControls)
				rightControls.style.display = "none";
			setupButtonControls();
		} else {
			if (leftControls) leftControls.style.display = "none";
			if (rightControls) rightControls.style.display = "none";
		}	
	}

	setOnresize();
	start();
}