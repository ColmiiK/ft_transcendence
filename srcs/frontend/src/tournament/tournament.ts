import { getClientID } from "../messages/messages-page.js";
import { UserMatches, Tournament } from "../types.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { socketToast, showAlert } from "../toast-alert/toast-alert.js";
import { debounce } from "../friends/friends-fetch.js";
import { navigateTo } from "../index.js";


export function initTournamentEvents(){
	createTournament();
	initSearchPlayers();
  initTournamentSearch();
  initBackButton()
}
//Este archivo se puede modificar entero
function initBackButton() {
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      navigateTo('/games');
    });
  }
}

function initTournamentSearch(){
  const searchInput = document.getElementById('tournament-searcher') as HTMLInputElement;
  const searchButton = document.getElementById('tournament-search-button') as HTMLInputElement;

  if (searchInput && searchButton){
    // Handle search on button click
    searchButton.addEventListener('click', (event) => {
      event.preventDefault();
      handleTournamentSearch(searchInput.value);
    });

    // Handle search on Enter key
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter'){
        event.preventDefault();
        handleTournamentSearch(searchInput.value);
      }
    });
  }
}

async function handleTournamentSearch(tournamentId: string){
  if (!tournamentId.trim()){
    // If no ID provided, get all tournaments
    try {
      const tournaments = await sendRequest('GET', '/tournaments') as Tournament[];
      displayTournamentResults(tournaments);
    }
    catch (error){
      console.error('Error fetching tournaments:', error);
    }
    return;
  }
  try{
    // Get specific tournament by ID
    const tournament = await sendRequest('GET', `/tournaments/${tournamentId}`) as Tournament;
    displayTournamentResults([tournament]);
  }
  catch (error){
    console.error('Error fetching tournament:', error);
  }
}

function displayTournamentResults(tournaments: Tournament[]){
  const container = document.querySelector('.btns');
  const resultsDiv = document.createElement('div');
  resultsDiv.className = 'tournament-results';

  if (!tournaments || tournaments.length === 0){
    resultsDiv.innerHTML = '<p>No tournaments found</p>';
    return;
  }
  tournaments.forEach(tournament => {
    const tournamentElement = document.createElement('div');
    tournamentElement.className = 'tournament-item';
    // Check if user is already a participant or has been invited
    const isParticipant = tournament.tournament_participants.some(p => p.user_id === getClientID());
    const isInvited = tournament.tournament_invitations.some(i => i.user_id === getClientID());
    tournamentElement.innerHTML = `
      <div class="tournament-info">
        <h3>${tournament.name}</h3>
        <p>Status: ${tournament.status}</p>
        <p>Players: ${tournament.tournament_participants.length}/${tournament.player_limit}</p>
        <p>Game: ${tournament.game_type}</p>
        <p>Created: ${new Date(tournament.created_at).toLocaleString()}</p>
        ${tournament.started_at ? 
          `<p>Started: ${new Date(tournament.started_at).toLocaleString()}</p>` : 
          ''
        }
      </div>
      ${isParticipant ? 
        '<span class="already-joined">Already Joined</span>' :
        isInvited ?
        '<span class="pending">Invitation Pending</span>' :
        `<button class="join-button" data-tournament-id="${tournament.tournament_id}">
           Join Tournament
         </button>`
      }
    `;
    resultsDiv.appendChild(tournamentElement);
  });

  // Remove any existing results
  const existingResults = container?.querySelector('.tournament-results');
  if (existingResults)
    existingResults.remove();
  if (container)
    container.appendChild(resultsDiv);
  // Add event listeners to join buttons
  const joinButtons = resultsDiv.querySelectorAll('.join-button');
  joinButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const tournamentId = (e.target as HTMLButtonElement).dataset.tournamentId;
      if (tournamentId) {
        try {
          await sendRequest('POST', '/tournaments/invite', {
            tournament_id: parseInt(tournamentId),
            user_id: getClientID()
          });
          // Update the button to show pending status
          (e.target as HTMLButtonElement).disabled = true;
          (e.target as HTMLButtonElement).textContent = 'Request Sent';
        } catch (error) {
          console.error('Error joining tournament:', error);
        }
      }
    });
  });
}

function createTournament(){
  const container = document.querySelector(".tournament-creation");
  if (container){
		const inputElement = container.querySelector("input[type='text']") as HTMLInputElement | null;
    const gameTypeSelect = container.querySelector("#game-type") as HTMLSelectElement;
    const submitButton = container.querySelector("input[type='submit']") as HTMLInputElement;
    
    if (inputElement && gameTypeSelect && submitButton){
      submitButton.addEventListener("click", (event) => {
        event.preventDefault();
        const tournamentName = inputElement.value.trim();
        const game_type = gameTypeSelect.value;
        
        if (!tournamentName){
          showAlert("Please enter a tournament name", "toast-error");
          return;
        }
        if (!game_type){
          showAlert("Please select a game type", "toast-error");
          return;
        }
        /*if (!tournament){
          handleTournamentCreation(tournamentName, game_type);
          inputElement.value = "";
          gameTypeSelect.value = "";
        }
        else if (tournament)
          showAlert("You're already in a tournament. Finish or cancel it first.", "toast-error");*/
      });
    }
    // Handle Enter key
    if (inputElement){
      inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const tournamentName = inputElement.value.trim();
          const gameType = gameTypeSelect?.value;
          
          if (!tournamentName || !gameType){
            showAlert("Please fill all fields", "toast-error");
            return;
          }  
          handleTournamentCreation(tournamentName, gameType);
          inputElement.value = "";
          if (gameTypeSelect)
            gameTypeSelect.value = "";
        }
      });
    }
		initSearchPlayers();
  }
	else
    console.error(".tournament-creation not found");
}


function initSearchPlayers(){
  const searchInput = document.getElementById('player-search') as HTMLInputElement;
  const searchResults = document.getElementById('search-results');
  if (searchInput && searchResults) {
    searchInput.oninput = debounce(async () => {
        const query = searchInput.value.trim();
        if (query.length >= 2){
          try{
            const matches = await sendRequest('POST', '/users/search', { username: query }) as UserMatches[];
            displaySearchResults(matches, searchResults);
          } 
          catch (error){
            console.error('Error searching players:', error);
            searchResults.innerHTML = '<p>Error searching players</p>';
          }
        }
        else
          searchResults.innerHTML = '';
   } , 300)
  }
}


function displaySearchResults(players: UserMatches[], container: HTMLElement) {
  container.innerHTML = '';
  if (!Array.isArray(players)) {
    console.error('Expected players to be an array, got:', typeof players);
    container.innerHTML = '<p>Error: Invalid data format</p>';
    return;
  }
  if (players.length === 0) {
    container.innerHTML = '<p>No players found</p>';
    return;
  }
  players.forEach( async (player) => {
    const option = document.createElement('div');
    option.className = 'player-item';
    const is_invited = await sendRequest("POST", "/tournaments/isinvited", { tournament_id: tournament.tournament_id, user_id: player.user_id });
    const is_participant = await sendRequest("POST", "/tournaments/isparticipant", { tournament_id: tournament.tournament_id, user_id: player.user_id });
    const status = await sendRequest("POST", "/tournaments/invitationstatus", { tournament_id: tournament.tournament_id, user_id: player.user_id });
    if (!is_invited || status?.status === "denied") {
      option.innerHTML = `
        ${player.username}
        <svg id="invite-player-${player.user_id}" class="standard-icon rounded-full add" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
          <path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Z"/>
        </svg>
      `;

      const inviteButton = option.querySelector(`#invite-player-${player.user_id}`);
      if (inviteButton) {
        inviteButton.addEventListener("click", async () => {
          if (await sendTournamentInvitation(player.user_id, player.username) === true){
            option.innerHTML = `
              ${player.username}
              <svg xmlns="http://www.w3.org/2000/svg" class="pending rounded-full" viewBox="0 -960 960 960">
                <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
              </svg>
            `;
          } 
        });
      }
    } else if (is_invited && !is_participant) {
      option.innerHTML = `
        ${player.username}
        <svg xmlns="http://www.w3.org/2000/svg" class="pending rounded-full" viewBox="0 -960 960 960">
          <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
        </svg>
      `;
    } else if (is_invited && is_participant) {
      option.innerHTML = `
        ${player.username}
        <svg xmlns="http://www.w3.org/2000/svg" class="joined rounded-full" viewBox="0 -960 960 960">
          <path d="M880-80 720-240H320q-33 0-56.5-23.5T240-320v-40h440q33 0 56.5-23.5T760-440v-280h40q33 0 56.5 23.5T880-640v560Z"/>
        </svg>
      `;
    }
    container.appendChild(option);
  });
}
/*
async function sendTournamentInvitation(receiverId: number, username: string): Promise<boolean>{
  if (socketToast && socketToast.readyState === WebSocket.OPEN){

    if (tournament){
      const fullTournament = await sendRequest("GET", `/tournaments/${ tournament.tournament_id}`, ) as Tournament;
      const playerAmount = fullTournament.tournament_participants.length;
      console.log(playerAmount);
      if (fullTournament.player_limit === playerAmount)
      {
        showAlert("Tournament limit is four players", "toast-error");
        return (false);
      }
			socketToast.send(JSON.stringify({
				type: "tournament",
				info: "request",
				sender_id: getClientID(),
				receiver_id: receiverId,
				body: `/tournament ${username}`,
				tournament: tournament,
				sent_at: new Date().toISOString(),
			}));
      const searchInput = document.getElementById('player-search') as HTMLInputElement;
      const searchResults = document.getElementById('search-results');
      if (searchInput && searchResults){
        searchInput.value = '';
        searchResults.innerHTML = '';
      }
			return (true);
		}
  }
	else
    console.error("Toast socket is not connected");
	return (false);
}*/

export function handleTournamentCreation(input: string, gameType: string){
  const tournamentName = input.trim();
  if (tournamentName){
    console.log(`Creating tournament with name: ${tournamentName}`);
		//createSocketTournamentConnection(tournamentName, gameType);
    showAlert("Tournament has been created", "toast-success")
  }
}
