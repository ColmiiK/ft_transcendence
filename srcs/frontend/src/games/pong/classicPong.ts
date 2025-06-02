import { 
    Player, GeneralData, PaddleCollision, BallData, AIData, OnresizeData, init, 
	resetBall, updateScore, setAI, countDown, pauseGame, returnToGames, 
	play as playEngine, stop as stopEngine, moveBall as moveBallEngine,
} from './gameEngine.js';

import { Games } from "../../types.js";

export function classicPong(data: Games): void{
	const gameElement = document.getElementById('game');
	if (!gameElement){
		throw new Error("HTML 'game' element not found.");
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
        activate: data.gameMode === "ai" ? true : false,
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
		const savedState = localStorage.getItem("gameState");
		if (savedState){
			loadGameState();
			await pauseGame(generalData, ballData);
		}
		if (!savedState){
			await countDown(ballData, true);
			init(generalData, ballData, player1, player2, width);
		}
		generalData.controlGame = setInterval(play, generalData.time);
		if (AIData.activate) 
			AIData.controlAI = setInterval(moveAI, AIData.timeToRefresh);
	}

	function play(): void {
		if (generalData.isPaused || generalData.exitPause) return ;

		setOnresize();
		moveBall();
		playEngine(generalData, ballData, AIData, player1, player2, paddleCollisionData, width, height);
		saveGameState();
	}

	async function stop(): Promise<void> {
		await stopEngine(generalData, AIData, ballData);
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
			}
		};
		localStorage.setItem('gameState', JSON.stringify(gameState));
	}

	function loadGameState() {
		const savedState = localStorage.getItem('gameState');

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

			document.getElementById('counter1')!.innerText = player1.counter.toString();
			document.getElementById('counter2')!.innerText = player2.counter.toString();
		}
	}

	const initialize = () => {
		if (document.readyState === 'complete') {
			setOnresize();
			start();
		} else {
			window.addEventListener('load', () => {
				setOnresize();
				start();
			});
		}
	};

	async function clearGameState(){
		localStorage.removeItem('gameState');
		player1.counter = 0;
		player2.counter = 0;
		console.log('llamando funcioon');
		document.getElementById('counter1')!.innerText = '0';
		document.getElementById('counter2')!.innerText = '0';
	}

	window.addEventListener('beforeunload', () => {
		saveGameState();
	});

	document.addEventListener('DOMContentLoaded', function() {
		start();
		loadGameState();
		setOnresize();
	});

	window.addEventListener('popstate', async () => {
		await stop();
		await clearGameState();
});

	document.getElementById('pauseGame')?.addEventListener('click', async () => {
		await pauseGame(generalData, ballData);
	})

	document.getElementById('exitGame')?.addEventListener('click', async () => {
		await returnToGames(generalData, ballData, AIData);
	})

	setOnresize();
	initialize();
}