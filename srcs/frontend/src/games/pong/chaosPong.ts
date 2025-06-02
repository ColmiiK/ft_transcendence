import { 
    Player, GeneralData, PaddleCollision, BallData, AIData, OnresizeData, init, 
    resetBall, updateScore, setAI, countDown, pauseGame, returnToGames, checkLost,
	play as playEngine, stop as stopEngine, moveBall as moveBallEngine
} from './gameEngine.js';

import { Games } from "../../types.js";

export function chaosPong(data: Games): void {
	const gameElement = document.getElementById('game');
	if (!gameElement){
		throw new Error("HTML 'game' element not found.");
	}
	let width = gameElement.clientWidth;
	let height = gameElement.clientHeight;

	type PowerUpType = {
		powerUp: HTMLElement | null,
        types: Array<string>,
        active: boolean,
        timeout: NodeJS.Timeout | number;
        controlPowerUp: NodeJS.Timeout | null;
	}

	const powerUpData: PowerUpType = {
		powerUp: document.getElementById('powerUp'),
		types: ['paddleSize', 'ballSpeed', 'paddleSpeed', 'reverse'],
		active: false,
		timeout: 6000,
		controlPowerUp: null
    }

	const player1: Player = {
        keyPress: false,
        keyCode: null,
        paddle: document.getElementById('paddleLeft') as HTMLElement,
        paddleCenter: 0,
        counter: 0,
        paddleSpeed: 0.04,
		keysAffected: false
    };
    
    const player2: Player = {
        keyPress: false,
        keyCode: null,
        paddle: document.getElementById('paddleRight') as HTMLElement,
        paddleCenter: 0,
        counter: 0,
        paddleSpeed: 0.04,
		keysAffected: false
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
        activate: data.gameMode === "ai-custom" ? true : false,
        controlAI: null
    };

    const onresizeData: OnresizeData = {
        ballRelativeLeft: 0,
        ballRelativeTop: 0,
        player1RelativeTop: 0,
        player2RelativeTop: 0,
        powerUpRelativeLeft: 0,
        powerUpRelativeTop: 0,
        newSpeed: 0
    };

	async function start(): Promise<void> {
		const savedState = localStorage.getItem("gameState");
		if (savedState){
			loadGameState();
            if (!checkLost(generalData, ballData, AIData, player1, player2, width))
                 await pauseGame(generalData, ballData);
		}
		if (!savedState){
			await countDown(ballData, true);
			init(generalData, ballData, player1, player2, width);
		}
		generalData.controlGame = setInterval(play, generalData.time);
		powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);
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

	function stop(): void {
		saveGameState();
		stopEngine(generalData, AIData, ballData);
		if (powerUpData.controlPowerUp)
            clearInterval(powerUpData.controlPowerUp);
	}

	function moveBall(){
		checkBallPowerUpCollision();
		moveBallEngine(ballData, player1, player2, paddleCollisionData, generalData, width, height)
	}

	function moveAI(): void {
        if (generalData.isPaused || generalData.exitPause) return ;

		let random = Math.random();
		setAI(AIData, player2, ballData, height);

		AIData.targetY = random < 0.03 ? AIData.errorRate : AIData.targetY; // Tasa de error

		while (AIData.targetY < 0 || AIData.targetY > height)
			AIData.targetY = AIData.targetY < 0 ? AIData.targetY * -1 : 2 * height - AIData.targetY;

		if (player2.paddleCenter < AIData.targetY) {
            if (!player2.keysAffected)
                player2.keyCode = "down";
            else
                player2.keyCode = "up";
            player2.keyPress = true;
        }
        else if (player2.paddleCenter > AIData.targetY) {
            if (!player2.keysAffected)
                player2.keyCode = "up";
            else
                player2.keyCode = "down";
            player2.keyPress = true;
        }
	}

	document.onkeydown = function (e) {
        const key = e.key.toLowerCase();

        if (key === "w") {
            if (!player1.keysAffected)
                player1.keyCode = "up";
            else
                player1.keyCode = "down";
            player1.keyPress = true;
        }
        if (key === "s") {
            if (!player1.keysAffected)
                player1.keyCode = "down";
            else
                player1.keyCode = "up";
            player1.keyPress = true;
        }
        if (key === "arrowup" && !AIData.activate) {
            if (!player2.keysAffected)
                player2.keyCode = "up";
            else
                player2.keyCode = "down";
            player2.keyPress = true;
        }
        if (key === "arrowdown" && !AIData.activate && !player2.keysAffected) {
            if (!player2.keysAffected)
                player2.keyCode = "down";
            else
                player2.keyCode = "up";
            player2.keyPress = true;
        }
    };

	document.onkeyup = function(e: KeyboardEvent): void {
		const key = e.key.toLowerCase();
		if (key === "w" || key === "s") 
			player1.keyPress = false;
		if (key === "arrowup" || key === "arrowdown") 
			player2.keyPress = false;
	}

	/* PowerUp setup */

    function spawnPowerUp(): void {
        if (generalData.isPaused || generalData.exitPause) return ;
        if (powerUpData.active) return;

        powerUpData.active = true;
        const paddleLeft = player1.paddle.offsetLeft + player1.paddle.clientWidth;
        const paddleRight = player2.paddle.offsetLeft - 40;

        const x = Math.random() * (paddleRight - paddleLeft) + paddleLeft;
        const y = Math.random() * (height - 40);

        if (x < paddleLeft || x > paddleRight - paddleLeft || y > height || y < 40) {
            powerUpData.active = false;
            return;
        }

		if (!powerUpData.powerUp) return ;

        powerUpData.powerUp.style.left = `${x}px`;
        powerUpData.powerUp.style.top = `${y}px`;
        powerUpData.powerUp.style.display = "block";

        powerUpData.powerUp.classList.remove('powerUpAppear', 'powerUpBlink');
        void powerUpData.powerUp.offsetWidth;
        powerUpData.powerUp.classList.add('powerUpAppear');

        powerUpData.timeout = setTimeout(() => {
        powerUpData.powerUp?.classList.add('powerUpBlink');
        setTimeout(() => {
			if (! powerUpData.powerUp) return ;
            powerUpData.powerUp.classList.remove('powerUpBlink');
            powerUpData.powerUp.classList.add('powerUpDisappear');
            setTimeout(() => {
				if (! powerUpData.powerUp) return ;
                powerUpData.powerUp.style.display = "none";
                powerUpData.powerUp.classList.remove('powerUpAppear', 'powerUpDisappear');
                powerUpData.active = false;
            }, 400);
        }, 600);
    }, 6000);
    }

    function checkBallPowerUpCollision(): void {
        const ballRect = ballData.ball.getBoundingClientRect();
        const powerRect = powerUpData.powerUp?.getBoundingClientRect();

        if (powerRect && ballRect.left < powerRect.right &&
            ballRect.right > powerRect.left &&
            ballRect.top < powerRect.bottom &&
            ballRect.bottom > powerRect.top)
            activatePowerUp();
    }

    function activatePowerUp(): void {
        const power = powerUpData.types[Math.floor(Math.random() * powerUpData.types.length)];

        switch (power) {
            case 'paddleSize':
                activePaddleSize();
                break;
            case 'ballSpeed':
                activeBallSpeed();
                break;
            case 'paddleSpeed':
                activePaddleSpeed();
                break;
            case 'reverse':
                activeReverseControl();
                break;
        }

		if (powerUpData.powerUp) {
			powerUpData.powerUp.style.display = "none";
			powerUpData.powerUp.classList.remove('powerUpAnimate', 'powerUpDisappear');
		}

		clearTimeout(powerUpData.timeout);
		powerUpData.active = false;
    }

    function activePaddleSize(){
        const paddle = ballData.velX < 0 ? player2.paddle : player1.paddle;
        const paddleAffected = ballData.velX < 0 ? player1.paddle : player2.paddle;
        paddle.classList.add('paddleGrowEffect');
        paddleAffected.classList.add('paddleLittleEffect');
        generalData.paddleMargin = height * 0.05;

        if (paddle.offsetTop < generalData.paddleMargin)
            paddle.style.top = `${generalData.paddleMargin}px`;
        else if (paddle.offsetTop + paddle.clientHeight > height - generalData.paddleMargin)
            paddle.style.top = `${height - generalData.paddleMargin - paddle.clientHeight}px`;

        if (paddleAffected.offsetTop < generalData.paddleMargin)
            paddleAffected.style.top = `${generalData.paddleMargin}px`;
        else if (paddleAffected.offsetTop + paddleAffected.clientHeight > height - generalData.paddleMargin)
            paddleAffected.style.top = `${height - generalData.paddleMargin - paddleAffected.clientHeight}px`;

        setTimeout(() => {
            generalData.paddleMargin = height * 0.03;

            paddle.classList.remove('paddleGrowEffect');
            paddle.classList.add('paddleGrowToNormalEffect');
            if (paddle.offsetTop < generalData.paddleMargin)
                paddle.style.top = `${generalData.paddleMargin}px`;
            else if (paddle.offsetTop + paddle.clientHeight > height - generalData.paddleMargin)
                paddle.style.top = `${height - generalData.paddleMargin - paddle.clientHeight}px`;

            paddleAffected.style.height = "20%";
            paddleAffected.classList.remove('paddleLittleEffect');
            paddleAffected.classList.add('paddleLittleToNormalEffect');
            if (paddleAffected.offsetTop < generalData.paddleMargin)
                paddleAffected.style.top = `${generalData.paddleMargin}px`;
            else if (paddleAffected.offsetTop + paddleAffected.clientHeight > height - generalData.paddleMargin)
                paddleAffected.style.top = `${height - generalData.paddleMargin - paddleAffected.clientHeight}px`;
        }, 5000);
        setTimeout(() => {
            paddle.classList.remove('paddleGrowToNormalEffect');
            paddleAffected.classList.remove('paddleLittleToNormalEffect');
        }, 1500);
    }

    function activeBallSpeed(){
        ballData.velX *= 1.5;
        ballData.velY *= 1.5;

        const trailInterval = setInterval(() => {
            const trail = document.createElement("div");
            trail.className = "ballTrailClone";
    
            trail.style.left = `${ballData.ball.offsetLeft - ballData.velX}px`
            trail.style.top = `${ballData.ball.offsetTop - ballData.velY}px`;
    
            document.getElementById("game")?.appendChild(trail);
    
            setTimeout(() => trail.remove(), 400);
        }, 50);

        setTimeout(() => {
            ballData.velX /= 1.5;
            ballData.velY /= 1.5;
            clearInterval(trailInterval);
        }, 5000);
    }

    function activePaddleSpeed(){
        const playerAffected = ballData.velX < 0 ? player1 : player2;
        playerAffected.paddleSpeed = 0.06;

        setTimeout(() => {
            playerAffected.paddleSpeed = 0.04;
        }, 5000);
    }

    function activeReverseControl(){
        const playerAffected = ballData.velX < 0 ? player1 : player2;
        playerAffected.keysAffected = true;

        setTimeout(() => {
            playerAffected.keysAffected = false;
        }, 5000);
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

	window.addEventListener('beforeunload', () => {
		saveGameState();
	});

	document.addEventListener('DOMContentLoaded', function() {
		start();
		loadGameState();
		setOnresize();
	});

    document.getElementById('pauseGame')?.addEventListener('click', async () => {
        await pauseGame(generalData, ballData);
    })

	document.getElementById('exitGame')?.addEventListener('click', async () => {
		if (checkLost(generalData, ballData, AIData, player1, player2, width)){
			let cont = document.getElementById("continue");
			let pauseDiv = document.getElementById("pauseGame")
			if (cont) cont.style.display = "none";
			if (pauseDiv) pauseDiv.style.display = "none";
		}
		await returnToGames(generalData, ballData, AIData, player1, player2);
	})

	setOnresize();
	initialize();
}