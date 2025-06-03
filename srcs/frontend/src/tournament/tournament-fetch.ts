import { navigateTo } from "../index.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { Tournament, Match } from "../types.js";

export async function initTournamentFetches() {
	try {
		const data = await sendRequest('GET', '/tournaments/current');
		if (!data || !data.id)
			navigateTo('/games');
		const response = await sendRequest('GET', `/tournaments/${data.id}`) as Tournament;
		if (!response)
			throw new Error('Error while fetching current tournament');

		const tournamentTitle = document.getElementById('tournament-title') as HTMLSpanElement;
		if (tournamentTitle) { tournamentTitle.innerText = response.name };
		const semiFinalMatches = document.getElementsByClassName('semifinals');
		const finalMatch = document.getElementsByClassName('finals');
		const tieBreakerMatch = document.getElementsByClassName('tiebreaker');
		if (!semiFinalMatches || !finalMatch || !tieBreakerMatch) { return ; }
		let i = 0;
		response.tournament_matches.forEach((match: Match) => {
			if (match.match_phase === 'semifinals') {
				semiFinalMatches[i].innerHTML = match.first_player_alias;
				semiFinalMatches[i + 1].innerHTML = match.second_player_alias;
				i = 2;
			}
			else if (match.match_phase === 'finals') {
				finalMatch[0].innerHTML = match.first_player_alias;
				finalMatch[1].innerHTML = match.second_player_alias;
			}
			else if (match.match_phase === 'tiebreaker') {
				tieBreakerMatch[0].innerHTML = match.first_player_alias;
				tieBreakerMatch[1].innerHTML = match.second_player_alias;
			}
		});
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
	}
}