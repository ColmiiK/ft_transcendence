import { getTranslation } from "../functionalities/transcript.js";
import { navigateTo } from "../index.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { Tournament, Match, GameInfo } from "../types.js";

export async function initTournamentFetches() {
	try {
		const data = await sendRequest('GET', '/tournaments/current');
		if (!data || !data.id) {
			navigateTo('/games');
			return ;
		}
		const response = await sendRequest('GET', `/tournaments/${data.id}`) as Tournament;
		if (!response)
			throw new Error(getTranslation('tournament_error_fetching'));

		const tournamentTitle = document.getElementById('tournament-title') as HTMLSpanElement;
		if (tournamentTitle) { tournamentTitle.innerText = response.name };

		await cleanBrackets();
		setSemiFinals(response.tournament_matches);
		const finalMatch = response.tournament_matches.find((match: Match) => match.match_phase === 'finals');
		if (finalMatch)
			setFinals(finalMatch);
		const tieBreakerMatch = response.tournament_matches.find((match: Match) => match.match_phase === 'tiebreaker')
		if (tieBreakerMatch)
			setTieBreaker(tieBreakerMatch);

		const nextMatchButton = document.getElementById('next-match');
		const cancelTournamentButton = document.getElementById('cancel-tournament');
		if (!nextMatchButton || !cancelTournamentButton) { return ; }
		if (response.finished_at) {
			nextMatchButton.classList.add('hidden');
			cancelTournamentButton.classList.add('hidden');
		}
		else {
			nextMatchButton.onclick = () => { nextMatch(response.game_type ,response.tournament_matches) };
			cancelTournamentButton.onclick = () => { cancelTournament(response.tournament_id) };
		}
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
	}
}

function nextMatch(gameType: string, matches: Match[]) {
	const nextMatch = matches.find((match: Match) => !match.played_at);
	if (!nextMatch) { return ; }
	if (localStorage.getItem("username") !== nextMatch.host) {
		showAlert(getTranslation('select_not_host'), 'toast-error');
		return;
  	}
  
	let gameInfo: GameInfo = {
		game_mode: gameType,
		is_custom: !gameType.includes('classic'),
		match_id: nextMatch.match_id,
		first_player_alias: nextMatch.first_player_alias,
		second_player_alias: nextMatch.second_player_alias,
	};

	if (gameType.includes('pong'))
      navigateTo("/pong", gameInfo );
    else if (gameType.includes('connect'))
      navigateTo("/4inrow", gameInfo );	
}

async function cancelTournament(tournamentId: number) {
	if (!tournamentId) { return ; }
	try {
		const response = await sendRequest('PATCH', '/tournaments/end', { tournament_id: tournamentId });
		if (!response || response['error'])
			throw new Error(getTranslation('tournament_cancel_problem'));
		navigateTo('/games');
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
	}
}

async function cleanBrackets() {
	const brackets = document.getElementsByClassName('brackets') as HTMLCollectionOf<HTMLElement>;
	if (!brackets || brackets.length < 1) { return ; }

	for (let i = 0; i < brackets.length; i++) {
		brackets[i].classList.remove('bracket-loss');
		brackets[i].classList.remove('bracket-active');
	};
}

function setSemiFinals(matches: Match[]) {
	const semiFinalMatches = document.getElementsByClassName('semifinals') as HTMLCollectionOf<HTMLElement>;
	if (!semiFinalMatches || matches.length < 1) { return ; }
	let i = 0;
	matches.forEach((match: Match) => {
		if (match.match_phase === 'semifinals') {
			semiFinalMatches[i].innerHTML = match.first_player_alias;
			semiFinalMatches[i + 1].innerHTML = match.second_player_alias;
			
			if (match.match_status === 'finished') {
				if (match.loser_id === match.first_player_id)
					semiFinalMatches[i].classList.add('bracket-loss');
				else
					semiFinalMatches[i + 1].classList.add('bracket-loss');
			}
			else {
				semiFinalMatches[i].classList.add('bracket-active');
				semiFinalMatches[i + 1].classList.add('bracket-active');
			}

			i = 2;
		}
	});
}

function setFinals(match: Match) {
	const finalMatch = document.getElementsByClassName('finals') as HTMLCollectionOf<HTMLElement>;
	const results = document.getElementsByClassName('standings') as HTMLCollectionOf<HTMLElement>;
	const first = document.getElementById('first-position');

	if (!finalMatch || !match || !results || !first) { return ; }

	finalMatch[0].innerHTML = match.first_player_alias;
	finalMatch[1].innerHTML = match.second_player_alias;
			
	if (match.match_status === 'finished') {
		if (match.loser_id === match.first_player_id) {
			finalMatch[0].classList.add('bracket-loss');
			first.innerText = match.second_player_alias;
			results[0].innerText = match.second_player_alias;
			results[1].innerText = match.first_player_alias;
		}
		else {
			finalMatch[1].classList.add('bracket-loss');
			first.innerText = match.first_player_alias;
			results[0].innerText = match.first_player_alias;
			results[1].innerText = match.second_player_alias;
		}
	}
	else {
		finalMatch[0].classList.add('bracket-active');
		finalMatch[1].classList.add('bracket-active');
	}
}

function setTieBreaker(match: Match) {
	const tieBreakerMatch = document.getElementsByClassName('tiebreaker') as HTMLCollectionOf<HTMLElement>;
	const results = document.getElementsByClassName('standings') as HTMLCollectionOf<HTMLElement>;
	const third = document.getElementById('third-position');
	if (!tieBreakerMatch || !match || !results || !third) { return ; }

	tieBreakerMatch[0].innerHTML = match.first_player_alias;
	tieBreakerMatch[1].innerHTML = match.second_player_alias;
			
	if (match.match_status === 'finished') {
		if (match.loser_id === match.first_player_id) {
			tieBreakerMatch[0].classList.add('bracket-loss');
			third.innerText = match.second_player_alias;
			results[2].innerText = match.second_player_alias;
			results[3].innerText = match.first_player_alias;
		}
		else {
			tieBreakerMatch[1].classList.add('bracket-loss');
			third.innerText = match.first_player_alias;
			results[2].innerText = match.first_player_alias;
			results[3].innerText = match.second_player_alias;
		}
	}
	else {
		tieBreakerMatch[0].classList.add('bracket-active');
		tieBreakerMatch[1].classList.add('bracket-active');
	}
}