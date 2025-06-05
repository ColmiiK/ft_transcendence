import { navigateTo } from "../../index.js";
import { GameInfo } from "../../types.js";
import { sendRequest } from "../../login-page/login-fetch.js";
import { getTranslation } from "../../functionalities/transcript.js";

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

export function implementAlias(data: GameInfo){
	const alias1 = document.getElementById("alias1");
	const alias2 = document.getElementById("alias2");
	if (!alias1 || !alias2){
		console.error(getTranslation('game_not_alias'))
		return ;
	}
	alias1.innerText = data.first_player_alias;
	alias2.innerText = data.second_player_alias;
}

export function init(generalData: GeneralData, ballData: BallData, player1: Player, player2: Player, width: number): void {
	resetBall(generalData, ballData, player1, player2, width);
}

export function play(generalData: GeneralData, ballData: BallData, AIData: AIData, player1: Player, player2: Player, width: number, height: number, PowerUpData: PowerUpType | null, data: GameInfo): void {
	movePaddle(player1, player2, generalData, AIData, height);
	checkLost(generalData, ballData, AIData, PowerUpData, data, player1, player2, width);
}

export async function stop(generalData: GeneralData, AIData: AIData, ballData: BallData, PowerUpData: PowerUpType | null, data: GameInfo, player1: Player, player2: Player): Promise<void> {
	if (generalData.controlGame) 
		clearInterval(generalData.controlGame);
	if (AIData.activate && AIData.controlAI) 
		clearInterval(AIData.controlAI);
	if (PowerUpData && PowerUpData.controlPowerUp)
		clearInterval(PowerUpData.controlPowerUp)
	ballData.ball.style.display = "none";
	updateData(data, player1, player2);
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

export function insertWinner(win: string){
	const endGame = document.getElementById("endGame");
	if (!endGame){
		console.error(getTranslation('game_no_endGame'));
		return ;
	}
	const gamesCard = document.getElementById("gamesCard");
    if (!gamesCard){
        console.error(getTranslation('game_no_gamesCard'));
        return ;
    }
	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error(getTranslation('game_no_element'))
		return ;
	}
	const pauseBtn = document.getElementById('pauseGame')
	if (!pauseBtn){
		console.error(getTranslation('game_no_pauseGame'))
		return Promise.resolve();
	}
	const exitBtn = document.getElementById('exitGame')
	if (!exitBtn){
		console.error(getTranslation('game_no_exitGame'))
		return Promise.resolve();
	}
	exitBtn.style.display = 'none';
	pauseBtn.style.display = 'none';
	endGame.style.display = 'flex';
	gamesCard.style.display = 'flex';
	gameEl.style.animation = "mediumOpacity";

	const winner = document.getElementById("win");
	if (!winner){
		console.error(getTranslation('game_no_winner'));
		return ;
	}
	const loser = document.getElementById("loser");
	if (!loser){
		console.error(getTranslation('game_no_loser'));
		return ;
	}
	if (win == "Player 1"){
		winner.innerText = getTranslation('game_player1_wins');
		loser.innerText = getTranslation('game_player2_loses');
	}
	else{
		winner.innerText = getTranslation('game_player2_wins');
		loser.innerText = getTranslation('game_player1_loses');
	}
}

export function checkLost(generalData: GeneralData, ballData: BallData, AIData: AIData, PowerUpData: PowerUpType | null, data: GameInfo, player1: Player, player2: Player, width: number): boolean {
	if (ballData.ball.offsetLeft >= width) {
		updateScore(player1.paddle, player1, player2);
		if (player1.counter < 10) init(generalData, ballData, player1, player2, width);
		else {
			insertWinner("Player 1");
			stop(generalData, AIData, ballData, PowerUpData, data, player1, player2);
			return true;
		}
	}
	if (ballData.ball.offsetLeft <= 0) {
		updateScore(player2.paddle, player1, player2);
		if (player2.counter < 10) init(generalData, ballData, player1, player2, width);
		else {
			insertWinner("Player 2");
			stop(generalData, AIData, ballData, PowerUpData, data, player1, player2);
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
		console.error(getTranslation('game_no_countdown'))
		return Promise.resolve();
	}

	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error(getTranslation('game_no_element'));
		return Promise.resolve();
	}

	const pauseBtn = document.getElementById('pauseGame')
	if (!pauseBtn){
		console.error(getTranslation('game_no_pauseGame'));
		return Promise.resolve();
	}

	const exitBtn = document.getElementById('exitGame');
	if (!exitBtn){
		console.error(getTranslation('game_no_exitGame'));
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
	countDownEl.textContent = getTranslation('game_go');
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
		console.error(getTranslation('game_no_pause'));
		return Promise.resolve();
	}

	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error(getTranslation('game_no_element'))
		return Promise.resolve();
	}

	const pauseBtn = document.getElementById('pauseGame')
	if (!pauseBtn){
		console.error(getTranslation('game_no_pauseGame'))
		return Promise.resolve();
	}

	const exitBtn = document.getElementById('exitGame');
	if (!exitBtn){
		console.error(getTranslation('game_no_exitGame'));
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

export async function returnToGames(generalData: GeneralData, ballData: BallData, AIData: AIData, player1: Player, player2: Player, mode: "classic" | "custom", PowerUpData: PowerUpType | null, data: GameInfo): Promise<void> {
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

	const gameEl = document.getElementById('game');
	if (!gameEl){
		console.error(getTranslation('game_no_element'))
		return Promise.resolve();
	}

	exitBtn.style.pointerEvents = 'none';
	pauseBtn.style.pointerEvents = 'none';
	gameEl.style.animation = "mediumOpacity 0.25s ease forwards";
	await delay(250);

	const returnEl = document.getElementById('returnToGames');
	if (!returnEl){
		console.error(getTranslation('game_no_returnToGames'));
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

	document.getElementById('surrenderPl1')?.addEventListener('click', () => {
		player2.counter = 10;
		stop(generalData, AIData, ballData, PowerUpData, data, player1, player2);
		clearGameState(player1, player2, mode);
		if (mode == "custom" && PowerUpData)
			cleanupPowerUps(PowerUpData);
		navigateTo("/games");
	})

	document.getElementById('surrenderPl2')?.addEventListener('click', () => {
		player1.counter = 10;
		stop(generalData, AIData, ballData, PowerUpData, data, player1, player2);
		clearGameState(player1, player2, mode);
		if (mode == "custom" && PowerUpData)
			cleanupPowerUps(PowerUpData);
		navigateTo("/games");
	})
}

export async function exitGame(mode: "classic" | "custom", player1: Player, player2: Player, powerUpData: PowerUpType | null){
	clearGameState(player1, player2, mode);
	if (mode == "custom" && powerUpData)
		cleanupPowerUps(powerUpData);
	navigateTo("/games");
}

function clearGameState(player1: Player, player2: Player, mode: "classic" | "custom"){
	localStorage.removeItem(`gameState${mode}`);
	player1.counter = 0;
	player2.counter = 0;
	document.getElementById('counter1')!.innerText = '0';
	document.getElementById('counter2')!.innerText = '0';
}

async function updateData(data: GameInfo, player1: Player, player2: Player){
	if (data.match_id){
		const object = {
			match_id: data.match_id,
			first_player_score: player1.counter,
			second_player_score: player2.counter,
		}
		const response = await sendRequest("POST", "/matches/end", object);
		if (!response || response?.error){
			console.error(getTranslation('game_update_error'));
			return ;
		}
	}
	else {
		const object = {
			first_player_score: player1.counter,
			second_player_score: player2.counter,
			first_player_alias: data.first_player_alias,
			second_player_alias: data.second_player_alias,
			is_custom: data.is_custom,
			game: "pong"
		}
		const response = await sendRequest("POST", "/matches", object);
		if (!response || response?.error){
			console.error(getTranslation('game_update_error'));
			return ;
		}
	}
}