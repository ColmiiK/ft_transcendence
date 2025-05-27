import { sendRequest } from "../login-page/login-fetch.js";
import { ChartStats, Historical } from "../types.js"
import { getTranslation } from "../functionalities/transcript.js"

export function initStatsFetch() {
	pongCharts();
	pongHistorical();
	connect4Charts();
	connect4Historical();
}

async function pongCharts() {
	const winsLossesChart = document.getElementById('pong-wins-losses-chart') as HTMLCanvasElement;
	const gameModesChart = document.getElementById('pong-game-modes-chart') as HTMLCanvasElement;
	const gamesPlayedChart = document.getElementById('pong-games-played-chart') as HTMLCanvasElement;
	if (!winsLossesChart || !gameModesChart || !gamesPlayedChart) { return ; }

	try {
		const response = await sendRequest('GET', '/matches/general/pong') as ChartStats;
		if (!response)
			throw new Error('Problem while fetching general stats');

		const wins = response.wins === 0 && response.losses === 0 ? 1 : response.wins;
		const losses = response.wins === 0 && response.losses === 0 ? 1 : response.losses;
		// @ts-ignore
		new Chart(winsLossesChart, {
			type: 'doughnut',
			data: {
				labels: [getTranslation('wins'), getTranslation('losses')],
				datasets: [
					{
						cutout: '35%',
						data: [wins, losses],
						borderColor: ['#FEE0EF', '#D087AB'],
						backgroundColor: ['#FEE0EF', '#D087AB'],
					},
				]
			},
			options: {
				plugins: {
					legend: {
						labels: {
							font: { family: 'Perfect DOS VGA', },
							color: '#FEE0EF',
						},
						position: 'left',
					},
					tooltip: {
						titleFont: () => ({ family: 'Perfect DOS VGA' }),
						bodyFont: () => ({ family: 'Perfect DOS VGA', size: 20 }),
						backgroundColor: '#522b66c7',
						displayColors: false,
						bodyAlign: 'center'
					}
				}
			}
		});

		const classic = response.standard_games === 0 && response.custom_games === 0 ? 1 : response.standard_games;
		const chaos = response.standard_games === 0 && response.custom_games === 0 ? 1 : response.custom_games;
		// @ts-ignore
		new Chart(gameModesChart, {
				type: 'doughnut',
				data: {
					labels: [getTranslation('classic'), getTranslation('chaos')],
					datasets: [
						{
							cutout: '35%',
							data: [classic, chaos],
							borderColor: ['#522B66', '#54184D'],
							backgroundColor: ['#522B66', '#54184D'],
						},
					]
				},
				options: {
				plugins: {
					legend: {
						labels: {
							font: { family: 'Perfect DOS VGA', },
							color: '#FEE0EF',
						},
						position: 'left',
					},
					tooltip: {
						titleFont: () => ({ family: 'Perfect DOS VGA' }),
						bodyFont: () => ({ family: 'Perfect DOS VGA', size: 20 }),
						backgroundColor: '#522b66c7',
						displayColors: false,
						bodyAlign: 'center'
					}
				}
			}
		});
	
		const resultsArray = response.last_ten_games.map((match: any) => { return match.score }); 
		// @ts-ignore
		new Chart(gamesPlayedChart, {
				type: 'line',
				data: {
					labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
					datasets: [
						{
							label: getTranslation('score_last_10'),
							data: resultsArray,
							borderColor: ['#FEE0EF'],
							backgroundColor: ['#D087AB'],
						},
					]
				},
				options: {
					scales: {
						x: {
							grid: {
								color: '#54184D'
							},
							ticks: {
								color: '#FEE0EF',
								font: { family: 'Perfect DOS VGA' }
							}	
						},
						y: {
							min: 0,
							suggestedMax: 10,
							grid: {
								color: '#54184D'
							},
							ticks: {
								color: '#FEE0EF',
								font: { family: 'Perfect DOS VGA' }
							}	
						}
					},
				plugins: {
					legend: {
						labels: {
							font: { family: 'Perfect DOS VGA' },
							color: '#FEE0EF',
						},
					},
					tooltip: {
						enabled: false,
					}
				}
			}
		});
	}
	catch (error) {
		console.error(error);
	}
}

async function pongHistorical() {
	const historicalDiv = document.getElementById("pong-historical-div");
	if (!historicalDiv) { return ; }

	try {
		const response = await sendRequest('GET', '/matches/history/pong') as Historical[];
		if (!response)
			throw new Error('Problem while fetching Pong historical');

		response.forEach((match) => {
			const section = document.createElement("section");
			section.setAttribute("id", `match-id-${match.match_id}`);
			section.classList.add('friend-class', 'friend-card');
			match.is_win ? section.classList.add('stats-won-card') : section.classList.add('stats-lost-card');
			section.innerHTML = `
						<div class="flex items-center gap-4">
							<img id="friend-avatar-${match.rival_id}" class="friend-avatar-${match.rival_id} card-avatar rounded-full m-1.5" src="${match.rival_avatar}" alt="Avatar">
						</div>
						<div id="friend-status" class="flex flex-col justify-between items-end px-4 w-full">
							<p>${match.custom_mode} - ${match.user_score}-${match.rival_score}</p>
							<h3 class="self-start">${match.rival_username}</h3>
							<p class="opacity-50 text-sm">${match.played_at.substring(0, 10)}</p>
						</div>
					`;
			historicalDiv.appendChild(section);
		})
	}
	catch (error) {
		console.error(error);
	}
}

export async function connect4Charts() {
	const winsLossesChart = document.getElementById('connect4-wins-losses-chart') as HTMLCanvasElement;
	const gameModesChart = document.getElementById('connect4-game-modes-chart') as HTMLCanvasElement;
	const gamesPlayedChart = document.getElementById('connect4-games-played-chart') as HTMLCanvasElement;
	if (!winsLossesChart || !gameModesChart || !gamesPlayedChart) { return ; }

	try {
		const response = await sendRequest('GET', '/matches/general/connect') as ChartStats;
		if (!response)
			throw new Error('Problem while fetching general stats');

		const wins = response.wins === 0 && response.losses === 0 ? 1 : response.wins;
		const losses = response.wins === 0 && response.losses === 0 ? 1 : response.losses;
		// @ts-ignore
		new Chart(winsLossesChart, {
			type: 'doughnut',
			data: {
				labels: [getTranslation('wins'), getTranslation('losses')],
				datasets: [
					{
						cutout: '35%',
						data: [wins, losses],
						borderColor: ['#FEE0EF', '#D087AB'],
						backgroundColor: ['#FEE0EF', '#D087AB'],
					},
				]
			},
			options: {
				plugins: {
					legend: {
						labels: {
							font: { family: 'Perfect DOS VGA', },
							color: '#FEE0EF',
						},
						position: 'left',
					},
					tooltip: {
						titleFont: () => ({ family: 'Perfect DOS VGA' }),
						bodyFont: () => ({ family: 'Perfect DOS VGA', size: 20 }),
						backgroundColor: '#522b66c7',
						displayColors: false,
						bodyAlign: 'center'
					}
				}
			}
		});

		const classic = response.standard_games === 0 && response.custom_games === 0 ? 1 : response.standard_games;
		const custom = response.standard_games === 0 && response.custom_games === 0 ? 1 : response.standard_games;
		// @ts-ignore
		new Chart(gameModesChart, {
				type: 'doughnut',
				data: {
					labels: [getTranslation('classic'), getTranslation('crazy_tokens')],
					datasets: [
						{
							cutout: '35%',
							data: [classic, custom],
							borderColor: ['#522B66', '#54184D'],
							backgroundColor: ['#522B66', '#54184D'],
						},
					]
				},
				options: {
				plugins: {
					legend: {
						labels: {
							font: { family: 'Perfect DOS VGA', },
							color: '#FEE0EF',
						},
						position: 'left',
					},
					tooltip: {
						titleFont: () => ({ family: 'Perfect DOS VGA' }),
						bodyFont: () => ({ family: 'Perfect DOS VGA', size: 20 }),
						backgroundColor: '#522b66c7',
						displayColors: false,
						bodyAlign: 'center'
					}
				}
			}
		});
	
		const resultsArray = response.last_ten_games.map((match: any) => { return match.score }); 
		// @ts-ignore
		new Chart(gamesPlayedChart, {
				type: 'line',
				data: {
					labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
					datasets: [
						{
							label: getTranslation('score_last_10'),
							data: resultsArray,
							borderColor: ['#FEE0EF'],
							backgroundColor: ['#D087AB'],
						},
					]
				},
				options: {
					scales: {
						x: {
							grid: {
								color: '#54184D'
							},
							ticks: {
								color: '#FEE0EF',
								font: { family: 'Perfect DOS VGA' }
							}	
						},
						y: {
							min: 0,
							suggestedMax: 10,
							grid: {
								color: '#54184D'
							},
							ticks: {
								color: '#FEE0EF',
								font: { family: 'Perfect DOS VGA' }
							}	
						}
					},
				plugins: {
					legend: {
						labels: {
							font: { family: 'Perfect DOS VGA' },
							color: '#FEE0EF',
						},
					},
					tooltip: {
						enabled: false,
					}
				}
			}
		});
	}
	catch (error) {
		console.error(error);
	}
}

async function connect4Historical() {
	const historicalDiv = document.getElementById("connect4-historical-div");
	if (!historicalDiv) { return ; }

	try {
		const response = await sendRequest('GET', '/matches/history/connect') as Historical[];
		if (!response)
			throw new Error('Problem while fetching Connect4 historical');

		response.forEach((match) => {
			const section = document.createElement("section");
			section.setAttribute("id", `match-id-${match.match_id}`);
			section.classList.add('friend-class', 'friend-card');
			match.is_win ? section.classList.add('stats-won-card') : section.classList.add('stats-lost-card');
			section.innerHTML = `
						<div class="flex items-center gap-4">
							<img id="friend-avatar-${match.rival_id}" class="friend-avatar-${match.rival_id} card-avatar rounded-full m-1.5" src="${match.rival_avatar}" alt="Avatar">
						</div>
						<div id="friend-status" class="flex flex-col justify-between items-end px-4 w-full">
							<p>${match.custom_mode} - ${match.user_score}-${match.rival_score}</p>
							<h3 class="self-start">${match.rival_username}</h3>
							<p class="opacity-50 text-sm">${match.played_at.substring(0, 10)}</p>
						</div>
					`;
			historicalDiv.appendChild(section);
		})
	}
	catch (error) {
		console.error(error);
	}
}
