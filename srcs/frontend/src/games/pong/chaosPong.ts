import { 
    Player, GeneralData, PaddleCollision, BallData, AIData, OnresizeData, PowerUpType, init, 
    resetBall, updateScore, setAI, countDown, pauseGame, returnToGames, checkLost,
	implementAlias, exitGame, play as playEngine, moveBall as moveBallEngine
} from './gameEngine.js';

import { GameInfo } from "../../types.js";
import { getTranslation } from '../../functionalities/transcript.js';

export function chaosPong(data: GameInfo): void {
	const gameElement = document.getElementById('game');
	if (!gameElement){
		throw new Error(getTranslation('game_not_found'));
	}
	let width = gameElement.clientWidth;
	let height = gameElement.clientHeight;

    const powerUpData: PowerUpType = {
        posX: 0,
        posY: 0,
        paddleAffected: null,
        powerUp: document.getElementById('powerUp'),
        types: ['paddleSize', 'ballSpeed', 'paddleSpeed', 'reverse'],
        active: false,
        power: null,
        timeout: 6000,
        controlPowerUp: null,
        powerUpStartTime: null,
        powerUpDuration: 5000,
        powerUpRemainingTime: 0,
        spawnStartTime: null,
        spawnRemainingTime: 0,
        isPaused: false
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
        activate: data.game_mode === "ai-custom" ? true : false,
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
		const savedState = localStorage.getItem("gameStatecustom");
		if (savedState){
			loadGameState();
            implementAlias(data);
            manageTouchPad();
            saveGameState();
            if (!checkLost(generalData, ballData, AIData, powerUpData, data, player1, player2, width))
                await pauseGame(generalData, ballData, powerUpData);
		}
		if (!savedState){
            implementAlias(data);
            manageTouchPad();
			await countDown(ballData, true);
			init(generalData, ballData, player1, player2, width);
            saveGameState();
		}
		generalData.controlGame = setInterval(play, generalData.time);

		if (!powerUpData.active && !powerUpData.power)
			powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);

		if (AIData.activate) 
			AIData.controlAI = setInterval(moveAI, AIData.timeToRefresh);
	}

	function play(): void {
        if (generalData.isPaused || generalData.exitPause) return ;

		setOnresize();
		moveBall();
		playEngine(generalData, ballData, AIData, player1, player2, width, height, powerUpData, data);
		saveGameState();
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
        if (key === "arrowdown" && !AIData.activate) {
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

    function setupButtonControls() {
		const btnPl1Up = document.getElementById("btnPl1Up");
		const btnPl1Down = document.getElementById("btnPl1Down");

		btnPl1Up?.addEventListener("touchstart", () => {
            if (!player1.keysAffected)
			    player1.keyCode = "up";
            else
                player1.keyCode = "down";
			player1.keyPress = true;
		});

		btnPl1Down?.addEventListener("touchstart", () => {
			if (!player1.keysAffected)
                player1.keyCode = "down";
            else
                player1.keyCode = "up";
			player1.keyPress = true;
		});

		const stopPl1 = () => { player1.keyPress = false; };

		btnPl1Up?.addEventListener("touchend", stopPl1);
		btnPl1Down?.addEventListener("touchend", stopPl1);

		if (!AIData.activate) {
			const btnPl2Up = document.getElementById("btnPl2Up");
			const btnPl2Down = document.getElementById("btnPl2Down");

			btnPl2Up?.addEventListener("touchstart", () => {
				if (!player2.keysAffected)
                    player2.keyCode = "up";
                else
                    player2.keyCode = "down";
				player2.keyPress = true;
			});

			btnPl2Down?.addEventListener("touchstart", () => {
				if (!player2.keysAffected)
                    player2.keyCode = "down";
                else
                    player2.keyCode = "up";
				player2.keyPress = true;
			});

			const stopPl2 = () => { player2.keyPress = false; };

			btnPl2Up?.addEventListener("touchend", stopPl2);
			btnPl2Down?.addEventListener("touchend", stopPl2);
		}
	}

	/* PowerUp setup */

    function animationPowerUp(): void {
        const remainingTime = powerUpData.spawnRemainingTime;
        
        powerUpData.timeout = setTimeout(() => {
            if (powerUpData.isPaused) return;
            
            powerUpData.powerUp?.classList.add('powerUpBlink');
            setTimeout(() => {
                if (!powerUpData.powerUp || powerUpData.isPaused) return ;
                powerUpData.powerUp.classList.remove('powerUpBlink');
                powerUpData.powerUp.classList.add('powerUpDisappear');
                setTimeout(() => {
                    if (!powerUpData.powerUp || powerUpData.isPaused) return ;
                    powerUpData.powerUp.style.display = "none";
                    powerUpData.powerUp.classList.remove('powerUpAppear', 'powerUpDisappear');
                    powerUpData.active = false;
                    powerUpData.spawnStartTime = null;
                    powerUpData.spawnRemainingTime = 0;
                    saveGameState();
                }, 400);
            }, 600);
        }, remainingTime);
}

    function spawnPowerUp(): void {
        if (generalData.isPaused || generalData.exitPause || powerUpData.isPaused) return;
        if (powerUpData.active || powerUpData.power) return;

        powerUpData.active = true;
        const paddleLeft = player1.paddle.offsetLeft + player1.paddle.clientWidth;
        const paddleRight = player2.paddle.offsetLeft - 40;

        powerUpData.posX = Math.random() * (paddleRight - paddleLeft) + paddleLeft;
        powerUpData.posY = Math.random() * (height - 40);

        if (powerUpData.posX < paddleLeft || powerUpData.posX > paddleRight || powerUpData.posY > height - 40 || powerUpData.posY < 40) {
            powerUpData.active = false;
            return;
        }

        if (!powerUpData.powerUp) {
            powerUpData.active = false;
            return;
        }

        powerUpData.spawnStartTime = Date.now();
        powerUpData.spawnRemainingTime = 5000;

        powerUpData.powerUp.style.left = `${powerUpData.posX}px`;
        powerUpData.powerUp.style.top = `${powerUpData.posY}px`;
        powerUpData.powerUp.style.display = "block";

        powerUpData.powerUp.classList.remove('powerUpAppear', 'powerUpBlink');
        void powerUpData.powerUp.offsetWidth;
        powerUpData.powerUp.classList.add('powerUpAppear');
        
        saveGameState();
        animationPowerUp();
    }

    function pausePowerUps(): void {
        powerUpData.isPaused = true;
        
        if (powerUpData.controlPowerUp) {
            clearInterval(powerUpData.controlPowerUp);
            powerUpData.controlPowerUp = null;
        }
        
        if (powerUpData.active && powerUpData.spawnStartTime) {
            const elapsed = Date.now() - powerUpData.spawnStartTime;
            powerUpData.spawnRemainingTime = Math.max(0, 5000 - elapsed);
            clearTimeout(powerUpData.timeout);
        }
        
        if (powerUpData.power && powerUpData.powerUpStartTime) {
            const elapsed = Date.now() - powerUpData.powerUpStartTime;
            powerUpData.powerUpRemainingTime = Math.max(0, powerUpData.powerUpDuration - elapsed);
        }
        
        saveGameState();
    }

    function resumePowerUps(): void {
        powerUpData.isPaused = false;

        if (!powerUpData.active && !powerUpData.power)
            powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);
        
        if (powerUpData.active && powerUpData.spawnRemainingTime > 0) {
            powerUpData.spawnStartTime = Date.now();
            animationPowerUp();
        }
        
        if (powerUpData.power && powerUpData.powerUpRemainingTime > 0) {
            powerUpData.powerUpStartTime = Date.now();
            
            switch (powerUpData.power) {
                case 'paddleSize':
                    activePaddleSize();
                    break;
                case 'ballSpeed':
                    activeBallSpeed();
                    break;
                case 'paddleSpeed':
                    activePaddleSpeed();
                    break;
                case 'reverseControl':
                    activeReverseControl();
                    break;
            }
        }
        
        saveGameState();
    }

    function checkBallPowerUpCollision(): void {
        if (!powerUpData.active || !powerUpData.powerUp) return;

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
        powerUpData.active = false;

        clearInterval(powerUpData.controlPowerUp!);

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
    }

    function activePaddleSize() {
        let paddle: HTMLElement;
        let paddleAffected: HTMLElement;

        if (!powerUpData.power) {
            paddle = ballData.velX < 0 ? player2.paddle : player1.paddle;
            paddleAffected = ballData.velX < 0 ? player1.paddle : player2.paddle;
            powerUpData.paddleAffected = paddleAffected;
            paddle.classList.add('paddleGrowEffect');
            paddleAffected.classList.add('paddleLittleEffect');
            generalData.paddleMargin = height * 0.05;
            powerUpData.power = "paddleSize";

            powerUpData.powerUpStartTime = Date.now();
            powerUpData.powerUpRemainingTime = powerUpData.powerUpDuration;
        }
        else {
            paddle = powerUpData.paddleAffected === player2.paddle ? player1.paddle : player2.paddle;
            paddleAffected = powerUpData.paddleAffected === player2.paddle ? player2.paddle : player1.paddle;
        
            paddle.style.height = `26.5%`;
            paddleAffected.style.height = '13.5%';
            generalData.paddleMargin = height * 0.05;
        }

        if (paddle.offsetTop < generalData.paddleMargin)
            paddle.style.top = `${generalData.paddleMargin}px`;
        else if (paddle.offsetTop + paddle.clientHeight > height - generalData.paddleMargin)
            paddle.style.top = `${height - generalData.paddleMargin - paddle.clientHeight}px`;

        if (paddleAffected.offsetTop < generalData.paddleMargin)
            paddleAffected.style.top = `${generalData.paddleMargin}px`;
        else if (paddleAffected.offsetTop + paddleAffected.clientHeight > height - generalData.paddleMargin)
            paddleAffected.style.top = `${height - generalData.paddleMargin - paddleAffected.clientHeight}px`;

        saveGameState();

        setTimeout(() => {
            if (powerUpData.isPaused) return;
            
            generalData.paddleMargin = height * 0.03;
            paddle.classList.remove('paddleGrowEffect');
            paddle.classList.add('paddleGrowToNormalEffect');
            
            paddleAffected.style.height = "20%";
            paddleAffected.classList.remove('paddleLittleEffect');
            paddleAffected.classList.add('paddleLittleToNormalEffect');
            
            setTimeout(() => {
                if (powerUpData.isPaused) return;

                paddle.classList.remove('paddleGrowToNormalEffect');
                paddleAffected.classList.remove('paddleLittleToNormalEffect');
                powerUpData.power = null;
                powerUpData.paddleAffected = null;
                powerUpData.powerUpStartTime = null;
                powerUpData.powerUpRemainingTime = 0;

                if (!powerUpData.active)
                    powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);
                saveGameState();
            }, 500);
        }, powerUpData.powerUpRemainingTime);
    }

    function activeBallSpeed() {
        if (!powerUpData.power) {
            powerUpData.power = "ballSpeed";
            ballData.velX *= 1.5;
            ballData.velY *= 1.5;
            powerUpData.powerUpStartTime = Date.now();
            powerUpData.powerUpRemainingTime = powerUpData.powerUpDuration;
        }

        saveGameState();

        const trailInterval = setInterval(() => {
            if (powerUpData.isPaused || !powerUpData.power) {
                clearInterval(trailInterval);
                return;
            }
            
            const trail = document.createElement("div");
            trail.className = "ballTrailClone";
            trail.style.left = `${ballData.ball.offsetLeft - ballData.velX}px`;
            trail.style.top = `${ballData.ball.offsetTop - ballData.velY}px`;
            document.getElementById("game")?.appendChild(trail);
            
            setTimeout(() => trail.remove(), 400);
        }, 50);

        saveGameState();

        setTimeout(() => {
            if (powerUpData.isPaused) return;
            
            ballData.velX /= 1.5;
            ballData.velY /= 1.5;
            clearInterval(trailInterval);
            powerUpData.power = null;
            powerUpData.powerUpStartTime = null;
            powerUpData.powerUpRemainingTime = 0;
            powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);
            saveGameState();
        }, powerUpData.powerUpRemainingTime);
    }

    function activePaddleSpeed() {
        let playerAffected: Player;
        
        if (!powerUpData.power) {
            powerUpData.power = "paddleSpeed";
            playerAffected = ballData.velX < 0 ? player1 : player2;
            playerAffected.paddleSpeed = 0.08;
            powerUpData.paddleAffected = playerAffected.paddle;
            powerUpData.powerUpStartTime = Date.now();
            powerUpData.powerUpRemainingTime = powerUpData.powerUpDuration;
        } else {
            playerAffected = powerUpData.paddleAffected === player1.paddle ? player1 : player2;
            playerAffected.paddleSpeed = 0.08;
        }

        saveGameState();

        setTimeout(() => {
            if (powerUpData.isPaused) return;
            
            playerAffected.paddleSpeed = 0.04;
            powerUpData.power = null;
            powerUpData.powerUpStartTime = null;
            powerUpData.powerUpRemainingTime = 0;
            powerUpData.paddleAffected = null;
            powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);
            saveGameState();
        }, powerUpData.powerUpRemainingTime);
    }

    function activeReverseControl() {
        let playerAffected: Player;
        
        if (!powerUpData.power) {
            powerUpData.power = "reverseControl";
            playerAffected = ballData.velX < 0 ? player1 : player2;
            playerAffected.keysAffected = true;
            powerUpData.paddleAffected = playerAffected.paddle;
            powerUpData.powerUpStartTime = Date.now();
            powerUpData.powerUpRemainingTime = powerUpData.powerUpDuration;
        } else {
            playerAffected = powerUpData.paddleAffected === player1.paddle ? player1 : player2;
            playerAffected.keysAffected = true;
        }

        saveGameState();

        setTimeout(() => {
            if (powerUpData.isPaused) return;
            
            playerAffected.keysAffected = false;
            powerUpData.power = null;
            powerUpData.powerUpStartTime = null;
            powerUpData.powerUpRemainingTime = 0;
            powerUpData.paddleAffected = null;
            powerUpData.controlPowerUp = setInterval(spawnPowerUp, 5000);
            saveGameState();
        }, powerUpData.powerUpRemainingTime);
    }

	function setOnresize(): void {
		onresizeData.ballRelativeLeft = ballData.ball.offsetLeft / width;
		onresizeData.ballRelativeTop = ballData.ball.offsetTop / height;
		onresizeData.player1RelativeTop = player1.paddle.offsetTop / height;
		onresizeData.player2RelativeTop = player2.paddle.offsetTop / height;

        if (powerUpData.active && powerUpData.powerUp) {
            onresizeData.powerUpRelativeLeft = powerUpData.posX / width;
            onresizeData.powerUpRelativeTop = powerUpData.posY / height;
        }

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

        if (powerUpData.active && powerUpData.powerUp && powerUpData.powerUp.style.display !== "none") {
            if (!onresizeData.powerUpRelativeLeft || !onresizeData.powerUpRelativeTop) return ;
            const newPowerUpX = onresizeData.powerUpRelativeLeft * width;
            const newPowerUpY = onresizeData.powerUpRelativeTop * height;
            
            const maxX = width - 40;
            const maxY = height - 40;
            
            powerUpData.posX = Math.min(Math.max(newPowerUpX, 0), maxX);
            powerUpData.posY = Math.min(Math.max(newPowerUpY, 0), maxY);
            
            powerUpData.powerUp.style.left = `${powerUpData.posX}px`;
            powerUpData.powerUp.style.top = `${powerUpData.posY}px`;
        }

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
        saveGameState();
	}

	function saveGameState() {
        let currentPowerUpRemainingTime = powerUpData.powerUpRemainingTime;
        if (powerUpData.power && powerUpData.powerUpStartTime && !powerUpData.isPaused) {
            const elapsed = Date.now() - powerUpData.powerUpStartTime;
            currentPowerUpRemainingTime = Math.max(0, powerUpData.powerUpDuration - elapsed);
            powerUpData.powerUpRemainingTime = currentPowerUpRemainingTime;
        }

        let currentSpawnRemainingTime = powerUpData.spawnRemainingTime;
        if (powerUpData.active && powerUpData.spawnStartTime && !powerUpData.isPaused) {
            const elapsed = Date.now() - powerUpData.spawnStartTime;
            currentSpawnRemainingTime = Math.max(0, 5000 - elapsed);
            powerUpData.spawnRemainingTime = currentSpawnRemainingTime;
        }

        const gameState = {
            player1: {
                counter: player1.counter,
                paddleTop: player1.paddle.offsetTop,
                paddleHeight: player1.paddle.clientHeight,
                paddleSpeed: player1.paddleSpeed,
                keysAffected: player1.keysAffected
            },
            player2: {
                counter: player2.counter,
                paddleTop: player2.paddle.offsetTop,
                paddleHeight: player2.paddle.clientHeight,
                paddleSpeed: player2.paddleSpeed,
                keysAffected: player2.keysAffected
            },
            ball: {
                posX: ballData.ball.offsetLeft,
                posY: ballData.ball.offsetTop,
                velX: ballData.velX,
                velY: ballData.velY,
                angle: ballData.angle
            },
            powerUp: {
                posX: powerUpData.posX,
                posY: powerUpData.posY,
                active: powerUpData.active,
                power: powerUpData.power,
                paddleAffected: powerUpData.paddleAffected === player1.paddle ? 'player1' : 
                                powerUpData.paddleAffected === player2.paddle ? 'player2' : null,
                powerUpStartTime: powerUpData.powerUpStartTime,
                powerUpRemainingTime: currentPowerUpRemainingTime,
                spawnStartTime: powerUpData.spawnStartTime,
                spawnRemainingTime: currentSpawnRemainingTime,
                isPaused: powerUpData.isPaused,
                powerUpVisible: powerUpData.powerUp?.style.display !== "none",
                powerUpClasses: powerUpData.powerUp?.className || ""
            },
            generalData: {
                time: generalData.time,
                speed: generalData.speed,
                isPaused: generalData.isPaused,
                paddleMargin: generalData.paddleMargin
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
        localStorage.setItem('gameStatecustom', JSON.stringify(gameState));
    }

	function loadGameState() {
        const savedState = localStorage.getItem('gameStatecustom');

        if (savedState) {
            const gameState = JSON.parse(savedState);

            player1.counter = gameState.player1.counter;
            player2.counter = gameState.player2.counter;

            player1.paddle.style.top = `${gameState.player1.paddleTop}px`;
            player2.paddle.style.top = `${gameState.player2.paddleTop}px`;

            player1.paddleSpeed = gameState.player1.paddleSpeed;
            player2.paddleSpeed = gameState.player2.paddleSpeed;

            player1.keysAffected = gameState.player1.keysAffected;
            player2.keysAffected = gameState.player2.keysAffected;

            player1.paddle.style.height = `${gameState.player1.paddleHeight}px`;
            player2.paddle.style.height = `${gameState.player2.paddleHeight}px`;

            ballData.ball.style.left = `${gameState.ball.posX}px`;
            ballData.ball.style.top = `${gameState.ball.posY}px`;
            ballData.velX = gameState.ball.velX;
            ballData.velY = gameState.ball.velY;
            ballData.angle = gameState.ball.angle;

            generalData.time = gameState.generalData.time;
            generalData.speed = gameState.generalData.speed;
            generalData.isPaused = gameState.generalData.isPaused || false;

            data.first_player_alias = gameState.Data.alias1;
            data.second_player_alias = gameState.Data.alias2;
            data.game_mode = gameState.Data.game_mode;
            data.is_custom = gameState.Data.is_custom;
            data.match_id = gameState.Data.match_id;

            if (gameState.generalData.paddleMargin)
                generalData.paddleMargin = gameState.generalData.paddleMargin;

            if (powerUpData.powerUp && gameState.powerUp) {
                powerUpData.posX = gameState.powerUp.posX;
                powerUpData.posY = gameState.powerUp.posY;
                powerUpData.active = gameState.powerUp.active;
                powerUpData.power = gameState.powerUp.power;
                powerUpData.isPaused = gameState.powerUp.isPaused || false;
                powerUpData.powerUpStartTime = gameState.powerUp.powerUpStartTime;
                powerUpData.powerUpRemainingTime = gameState.powerUp.powerUpRemainingTime || 0;
                powerUpData.spawnStartTime = gameState.powerUp.spawnStartTime;
                powerUpData.spawnRemainingTime = gameState.powerUp.spawnRemainingTime || 0;

                if (gameState.powerUp.paddleAffected === 'player1')
                    powerUpData.paddleAffected = player1.paddle;
                else if (gameState.powerUp.paddleAffected === 'player2')
                    powerUpData.paddleAffected = player2.paddle;
                
                if (gameState.powerUp.active && gameState.powerUp.powerUpVisible) {
                    powerUpData.powerUp.style.left = `${powerUpData.posX}px`;
                    powerUpData.powerUp.style.top = `${powerUpData.posY}px`;
                    powerUpData.powerUp.style.display = "block";
                    powerUpData.powerUp.className = gameState.powerUp.powerUpClasses;

                    if (!powerUpData.isPaused && powerUpData.spawnRemainingTime > 0) {
                        powerUpData.spawnStartTime = Date.now();
                        animationPowerUp();
                    }
                }

                if (gameState.powerUp.power && powerUpData.powerUpRemainingTime > 0) {
                    powerUpData.powerUpStartTime = Date.now();
                    
                    switch (gameState.powerUp.power) {
                        case 'paddleSize':
                            if (powerUpData.paddleAffected) {
                                const paddle = powerUpData.paddleAffected === player1.paddle ? player2.paddle : player1.paddle;
                                const paddleAffected = powerUpData.paddleAffected;   
                                paddle.classList.add('paddleGrowEffect');
                                paddleAffected.classList.add('paddleLittleEffect');
                            }
                            activePaddleSize();
                            break;
                        case 'ballSpeed':
                            activeBallSpeed();
                            break;
                        case 'paddleSpeed':
                            activePaddleSpeed();
                            break;
                        case 'reverseControl':
                            activeReverseControl();
                            break;
                    }
                }
            }

            AIData.activate = gameState.AIData.activate;
            AIData.targetY = gameState.AIData.targetY;

            document.getElementById('counter1')!.innerText = player1.counter.toString();
            document.getElementById('counter2')!.innerText = player2.counter.toString();
        }
    }

    document.getElementById('pauseGame')?.addEventListener('click', async () => {
        if (generalData.isPaused) resumePowerUps();
        else pausePowerUps();
        await pauseGame(generalData, ballData, powerUpData);
    });

    document.getElementById('exit-end')?.addEventListener('click', async () => {
        await exitGame("custom", player1, player2, powerUpData, data)
    });

	document.getElementById('exitGame')?.addEventListener('click', async () => {
		if (checkLost(generalData, ballData, AIData, powerUpData, data, player1, player2, width)){
			let cont = document.getElementById("continue");
			let pauseDiv = document.getElementById("pauseGame")
			if (cont) cont.style.display = "none";
			if (pauseDiv) pauseDiv.style.display = "none";
		}
        saveGameState();
		await returnToGames(generalData, ballData, AIData, player1, player2, "custom", powerUpData, data);
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