import { moveToHome } from "../messages/messages-page.js";
import { initStatsFetch } from "./stats-fetch.js";

export function initStatsEvents() {
	moveToHome();
	initStatsFetch();

	const pongPageButton = document.getElementById("pong-stats-page");
	const connect4PageButton = document.getElementById("connect4-stats-page");
	const pongPage = document.getElementById("pong-stats");
	const connect4Page = document.getElementById("connect4-page");
	if (!pongPageButton || !connect4PageButton || !pongPage || !connect4Page) { return ; }
	pongPageButton.onclick = () => {
		connect4Page.classList.add('hidden');	
		pongPage.classList.remove('hidden');
	};
	connect4PageButton.onclick = async () => {
		pongPage.classList.add('hidden');
		connect4Page.classList.remove('hidden');
	};
}

