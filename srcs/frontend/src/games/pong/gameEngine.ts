import { getClientID } from "../../messages/messages-page.js";
import { GameState } from "../../types.js";
import { navigateTo } from "../../index.js";
import { chaosPong } from "./chaosPong.js";

//export let socketPong: WebSocket | null;
//let current_game: GameState | null = null;

export interface Player {
	keyPress: boolean;
    keyCode: string | null;
    paddle: HTMLElement;
    paddleCenter: number;
    counter: number;
	paddleSpeed: number;
    keysAffected?: boolean;
}

export interface GeneralData {
	time: number;
	speed: number;
	paddleMargin: number;
	controlGame: NodeJS.Timeout | null;
	isPaused: boolean;
	exitPause: boolean;
}

export interface PaddleCollision {
	offset: number;
	maxBounceAngle: number;
	newVelX: number;
}

export interface BallData {
	ball: HTMLElement;
	velX: number;
	velY: number;
	angle: number;
	ballCenter: number;
}

export interface AIData {
	timeToRefresh: number;
	targetY: number;
	timeToReach: number;
	errorRate: number;
	activate: boolean;
	controlAI: NodeJS.Timeout | null;
}

export interface OnresizeData {
	ballRelativeLeft: number;
	ballRelativeTop: number;
	player1RelativeTop: number;
	player2RelativeTop: number;
	powerUpRelativeLeft?: number;
    powerUpRelativeTop?: number;
	newSpeed: number;
}

export interface PowerUpType {
	posX: number,
	posY: number,
	paddleAffected: HTMLElement | null,
	powerUp: HTMLElement | null,
	types: Array<string>,
	active: boolean,
	power: string | null,
	timeout: NodeJS.Timeout | number;
	controlPowerUp: NodeJS.Timeout | null;
	powerUpStartTime: number | null;
	powerUpDuration: number;
	powerUpRemainingTime: number;
	spawnStartTime: number | null;
	spawnRemainingTime: number;
	isPaused: boolean;
}

export function init(generalData: GeneralData, ballData: BallData, player1: Player, player2: Player, width: number): void {
	resetBall(generalData, ballData, player1, player2, width);
}

export function play(generalData: GeneralData, ballData: BallData, AIData: AIData, player1: Player, player2: Player, width: number, height: number, PowerUpData: PowerUpType | null): void {
	movePaddle(player1, player2, generalData, AIData, height);
	checkLost(generalData, ballData, AIData, PowerUpData, player1, player2, width);
}

export async function stop(generalData: GeneralData, AIData: AIData, ballData: BallData, PowerUpData: PowerUpType | null): Promise<void> {
	if (generalData.controlGame) 
		clearInterval(generalData.controlGame);
	if (AIData.activate && AIData.controlAI) 
		clearInterval(AIData.controlAI);
	if (PowerUpData && PowerUpData.controlPowerUp)
		clearInterval(PowerUpData.controlPowerUp)
	ballData.ball.style.display = "none";
}

export function resetBall(generalData: GeneralData, ballData: BallData, player1: Player, player2: Player, width: number): void {
	generalData.speed = 0.01;
	ballData.ball.style.left = "50%";
	ballData.ball.style.top = Math.floor(Math.random() * 100) + "%";
	ballData.angle = (Math.random() * Math.PI / 2) - Math.PI / 4;

	ballData.velX = width * generalData.speed * Math.cos(ballData.angle)
	if ((player1.counter + player2.counter) % 2 === 0)
		ballData.velX *= -1;
	ballData.velY = width * generalData.speed * Math.sin(ballData.angle);
}

export function insertWinner(winner: string){
	const winnerDiv = document.getElementById("winnerPong");
	if (!winnerDiv){
		console.error("winnerPong element not found.");
		return ;
	}
	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error("game element not found.")
		return ;
	}
	const pauseBtn = document.getElementById('pauseGame')
	if (!pauseBtn){
		console.error("pauseGame element not found.")
		return Promise.resolve();
	}
	pauseBtn.style.display = 'none';
	winnerDiv.style.display = 'block';
	winnerDiv.innerText = `${winner} wins !`
	gameEl.style.animation = "mediumOpacity";
}

export function checkLost(generalData: GeneralData, ballData: BallData, AIData: AIData, PowerUpData: PowerUpType | null, player1: Player, player2: Player, width: number): boolean {
	if (ballData.ball.offsetLeft >= width) {
		updateScore(player1.paddle, player1, player2);
		if (player1.counter < 10) init(generalData, ballData, player1, player2, width);
		else {
			insertWinner("Player 1");
			stop(generalData, AIData, ballData, PowerUpData);
			return true;
		}
	}
	if (ballData.ball.offsetLeft <= 0) {
		updateScore(player2.paddle, player1, player2);
		if (player2.counter < 10) init(generalData, ballData, player1, player2, width);
		else {
			insertWinner("Player 2");
			stop(generalData, AIData, ballData, PowerUpData);
			return true ;
		}
	}
	return false;
}

export function updateScore(paddle: HTMLElement, player1: Player, player2: Player): void {
	if (paddle === player1.paddle && player1.counter < 10) {
		player1.counter++;
		const counter1 = document.getElementById('counter1');
		if (counter1) counter1.innerHTML = player1.counter.toString();
	} else if (paddle === player2.paddle && player2.counter < 10){
		player2.counter++;
		const counter2 = document.getElementById('counter2');
		if (counter2) counter2.innerHTML = player2.counter.toString();
	}
}

export function moveBall(ballData: BallData, player1: Player, player2: Player, paddleCollisionData: PaddleCollision, generalData: GeneralData, width: number, height: number): void {
	checkState(player1, player2, ballData, paddleCollisionData, generalData, width, height);

	ballData.ball.style.left = `${ballData.ball.offsetLeft + ballData.velX}px`;
	ballData.ball.style.top = `${ballData.ball.offsetTop + ballData.velY}px`;

	if (ballData.ball.offsetTop <= 0) {
		ballData.ball.style.top = `0px`;
		ballData.velY *= -1;
	} else if (ballData.ball.offsetTop + ballData.ball.clientHeight >= height) {
		ballData.ball.style.top = `${height - ballData.ball.clientHeight}px`;
		ballData.velY *= -1;
	}
}

export function checkState(player1: Player, player2: Player, ballData: BallData, paddleCollisionData: PaddleCollision, generalData: GeneralData, width: number, height: number): void {
	if (collidePlayer(player1.paddle, ballData)) 
		handlePaddleCollision(player1, player1, player1.paddle, ballData, paddleCollisionData, generalData, width, height);
	else if (collidePlayer(player2.paddle, ballData))
		handlePaddleCollision(player2, player1, player2.paddle, ballData, paddleCollisionData, generalData, width, height);
}

export function collidePlayer(paddle: HTMLElement, ballData: BallData): boolean {
	if (((ballData.ball.offsetLeft + ballData.ball.clientWidth) >= paddle.offsetLeft) &&
		(ballData.ball.offsetLeft <= (paddle.offsetLeft + paddle.clientWidth)) &&
		((ballData.ball.offsetTop + ballData.ball.clientHeight) >= paddle.offsetTop) &&
		(ballData.ball.offsetTop <= (paddle.offsetTop + paddle.clientHeight)))
		return true;
	return false;
}

export function setPaddleCollision(player: Player, paddle: HTMLElement, ballData: BallData, paddleCollisionData: PaddleCollision, generalData: GeneralData, width: number): void {
	player.paddleCenter = paddle.offsetTop + paddle.clientHeight / 2;
	ballData.ballCenter = ballData.ball.offsetTop + ballData.ball.clientHeight / 2;

	paddleCollisionData.offset = (ballData.ballCenter - player.paddleCenter) / (paddle.clientHeight / 2);
	paddleCollisionData.maxBounceAngle = Math.PI / 4;

	generalData.speed = 0.02;
	ballData.angle = paddleCollisionData.offset * paddleCollisionData.maxBounceAngle;
	paddleCollisionData.newVelX = width * generalData.speed * Math.cos(ballData.angle);
}

export function handlePaddleCollision(player: Player, player1:Player, paddle: HTMLElement, ballData: BallData, paddleCollisionData: PaddleCollision, generalData: GeneralData, width: number, height: number): void {
	setPaddleCollision(player, paddle, ballData, paddleCollisionData, generalData, width);

	if (Math.abs(paddleCollisionData.newVelX) < 2)
		paddleCollisionData.newVelX = paddleCollisionData.newVelX > 0 ? 2 : -2

	ballData.velX = ballData.velX > 0 ? paddleCollisionData.newVelX * -1 : paddleCollisionData.newVelX * 1;
	ballData.velY = height * generalData.speed * Math.sin(ballData.angle);
	ballData.ball.style.left = paddle === player1.paddle ? `${paddle.offsetLeft + paddle.clientWidth}px` : `${paddle.offsetLeft - ballData.ball.clientWidth}px`;
}

export function movePaddle(player1: Player, player2: Player, generalData: GeneralData, AIData: AIData, height: number): void {
	if (player1.keyPress) {
		if (player1.keyCode === "up" && player1.paddle.offsetTop >= generalData.paddleMargin)
			player1.paddle.style.top = `${player1.paddle.offsetTop - height * player1.paddleSpeed}px`;
		if (player1.keyCode === "down" && (player1.paddle.offsetTop + player1.paddle.clientHeight) <= height - generalData.paddleMargin)
			player1.paddle.style.top = `${player1.paddle.offsetTop + height * player1.paddleSpeed}px`;
	}
	if (player2.keyPress) {
		if (AIData.activate) {
			if ((AIData.targetY >= player2.paddle.offsetTop) && (AIData.targetY <= (player2.paddle.offsetTop + player2.paddle.clientHeight)))
				player2.keyPress = false;
		}
		if (player2.keyCode === "up" && player2.paddle.offsetTop >= generalData.paddleMargin)
			player2.paddle.style.top = `${player2.paddle.offsetTop - height * player2.paddleSpeed}px`;
		if (player2.keyCode === "down" && (player2.paddle.offsetTop + player2.paddle.clientHeight) <= height - generalData.paddleMargin)
			player2.paddle.style.top = `${player2.paddle.offsetTop + height * player2.paddleSpeed}px`;
	}
}

export function setAI(AIData: AIData, player2: Player, ballData: BallData, height: number): void {
	AIData.timeToReach = (player2.paddle.offsetLeft - ballData.ball.offsetLeft) / ballData.velX;
	AIData.targetY = ballData.ball.offsetTop + ballData.velY * AIData.timeToReach;
	AIData.errorRate = player2.paddleCenter < AIData.targetY ? Math.random() * height - player2.paddleCenter : Math.random() * player2.paddleCenter - 0;
	player2.paddleCenter = player2.paddle.offsetTop + player2.paddle.clientHeight / 2; 
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function countDown(ballData: BallData, start: boolean): Promise<void>{
	const countDownEl = document.getElementById('countdown')
	if (!countDownEl){
		console.error("countdown element not found.")
		return Promise.resolve();
	}

	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error("game element not found.")
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

	exitBtn.style.pointerEvents = 'none';
	pauseBtn.style.pointerEvents = 'none';
	countDownEl.style.display = 'block';
	if (start) ballData.ball.style.display = 'none';

	for (let i = 3; i > 0; i--){
		countDownEl.textContent = i.toString();
		countDownEl.style.animation = 'countdownPulse 1s ease-in-out';
		await delay(1000);
		countDownEl.style.animation = 'none'
		void countDownEl.offsetWidth;
	}
	countDownEl.textContent = '¡GO!';
	await delay(1000);

	countDownEl.style.animation = 'fadeOut 0.5s';
	await delay(500);

	countDownEl.style.display = 'none';
	gameEl.style.animation = "fullOpacity 0.25s ease forwards"
	if (start) ballData.ball.style.display = 'block';
	pauseBtn.style.pointerEvents = 'auto';
	exitBtn.style.pointerEvents = 'auto';

	return Promise.resolve();
}

export async function pauseGame(generalData: GeneralData, ballData: BallData, powerUpData: PowerUpType | null): Promise<void> {
	const pauseEl = document.getElementById('pause');
	if (!pauseEl){
		console.error("pause element not found.");
		return Promise.resolve();
	}

	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error("game element not found.")
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
	exitBtn.style.pointerEvents = 'none';

	if (!generalData.isPaused){
		generalData.isPaused = true;
		pauseEl.style.display = 'block';
		gameEl.style.animation = "mediumOpacity 0.25s ease forwards";
		await delay(250);
	}
	else{
		pauseEl.style.display = 'none';
		await countDown(ballData, false)
		await delay(250);
		generalData.isPaused = false;
		if (powerUpData)
			powerUpData.isPaused = false;
	}
	return Promise.resolve();
}

function cleanupPowerUps(powerUpData: PowerUpType) {
	if (powerUpData.timeout) {
		clearTimeout(powerUpData.timeout);
		powerUpData.timeout = 6000;
	}
	
	if (powerUpData.controlPowerUp) {
		clearInterval(powerUpData.controlPowerUp);
		powerUpData.controlPowerUp = null;
	}
	
	const trails = document.querySelectorAll('.ballTrailClone');
	trails.forEach(trail => trail.remove());
	
	powerUpData.active = false;
	powerUpData.power = null;
	powerUpData.paddleAffected = null;
	powerUpData.powerUpStartTime = null;
	powerUpData.powerUpRemainingTime = 0;
	powerUpData.spawnStartTime = null;
	powerUpData.spawnRemainingTime = 0;
	powerUpData.isPaused = false;
	
	if (powerUpData.powerUp) {
		powerUpData.powerUp.style.display = "none";
		powerUpData.powerUp.className = "";
	}
}

export async function returnToGames(generalData: GeneralData, ballData: BallData, AIData: AIData, player1: Player, player2: Player, mode: "classic" | "custom", PowerUpData: PowerUpType | null): Promise<void> {
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

	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error("game element not found.")
		return Promise.resolve();
	}

	exitBtn.style.pointerEvents = 'none';
	pauseBtn.style.pointerEvents = 'none';
	gameEl.style.animation = "mediumOpacity 0.25s ease forwards";
	await delay(250);

	const returnEl = document.getElementById('returnToGames');
	if (!returnEl){
		console.error("returnToGames element not found.");
		return Promise.resolve();
	}
	returnEl.style.display = 'block';
	generalData.exitPause = true;

	document.getElementById('continue')?.addEventListener('click', async () => {
		returnEl.style.display = 'none';
		await countDown(ballData, false);
		generalData.exitPause = false;
		return ;
	})

	document.getElementById('exit')?.addEventListener('click', () => {
		stop(generalData, AIData, ballData, PowerUpData);
		clearGameState(player1, player2, mode);
		if (mode == "custom" && PowerUpData)
			cleanupPowerUps(PowerUpData);
		navigateTo("/games");
	})

	function clearGameState(player1: Player, player2: Player, mode: "classic" | "custom"){
		localStorage.removeItem(`gameState${mode}`);
		player1.counter = 0;
		player2.counter = 0;
		document.getElementById('counter1')!.innerText = '0';
		document.getElementById('counter2')!.innerText = '0';
	}
	
}

/*export async function createSocketPongConnection(): Promise<boolean> {
return new Promise((resolve, reject) => {
		if (socketPong && socketPong.readyState !== WebSocket.CLOSED)
			socketPong.close();
		try{
			socketPong = new WebSocket(`wss://${window.location.hostname}:8443/ws/pong`)
			if (!socketPong)
				return false;
			socketPong.onopen = () => {
				let id = getClientID();
				console.log("WebSocketPong connection established, sending id:", id);
				if (id === -1){
					console.error("Invalid ID, cannot connect to back")
					return ;
				}
				else{
					if (!socketPong)
						return ;
					socketPong.send(JSON.stringify({
						userId: id,
						action: "identify"
					}));
					console.log("ID succesfully sent");
				}
			};
			socketPong.onmessage = (event) => {
				try{
					const data = JSON.parse(event.data);
					if (data.type === "connection" && data.status === "success"){
						setupGameHandler();
						resolve(true);
					}
				}
				catch(err){
					reject(err);
				}
			};
			socketPong.onerror = (error) => {
				console.error("WebSocket error:", error);
			};
			socketPong.onclose = () => {
				console.log("WebSocketPong connection closed");
				socketPong = null;
			};
		}
		catch(err){
			console.error("Error creating WebSocketPong:", err);
			reject(err);
		}
	})
}

function setupGameHandler(){
	if (!socketPong)
		return ;
	socketPong.onmessage = (event) =>{
		try{
			const data = JSON.parse(event.data);
			if (data.type === "start_game"){
				current_game = {
					gameId: data.game_id,
					role: data.role,
					opponent_id: data.opponent_id,
					isPlaying: false
				};
				
			}
			else if (data.type === "game_started"){

			}
		}
		catch(err){

		}
	};
}*/