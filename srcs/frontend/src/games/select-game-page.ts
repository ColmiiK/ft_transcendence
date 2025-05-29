import { getTranslation } from "../functionalities/transcript.js";
import { navigateTo } from "../index.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { GamePlayer } from "../types.js"

export function initSelectPageEvent(){
  const homeButton = document.getElementById('home-button') as HTMLButtonElement;
  if (homeButton)
    homeButton.onclick = () => { navigateTo('/home'); };

  listenDocument();

  const createTournament = document.getElementById('create-tournament');
  const viewTournament = document.getElementById('view-tournament');
  if (!createTournament || !viewTournament) { return ; }
  createTournament.onclick = () => { showTournamentForm() };
  viewTournament.onclick = () => { navigateTo('/tournament') };

  const loginButton = document.getElementById('login-button') as HTMLButtonElement;
  const loginForm = document.getElementById('login-form');
  loginButton.onclick = (e: Event) => {
    e.preventDefault();
    loginForm?.classList.toggle('hidden');
  }
}

function listenDocument() {
  document.addEventListener('click', (event: Event) => {
    const optionsModal = document.getElementById('game-options-modal');
    const normalModeButton = document.getElementById('normal-button') as HTMLButtonElement;
    const customModeButton = document.getElementById('custom-button') as HTMLButtonElement;
    const normalModeOptions = document.getElementsByClassName('normal-modes')[0];
    const customModeOptions = document.getElementsByClassName('custom-modes')[0];
    if (!optionsModal) { return ; }
    if (optionsModal.classList.contains('hidden') === false && 
      !isElementOrAncestor(event.target as HTMLElement, 'game-options-modal')) {
        normalModeButton.classList.add('active');
        customModeButton.classList.remove('active');
        normalModeOptions.classList.remove('hidden');
        customModeOptions.classList.add('hidden');
        optionsModal.classList.add('hidden');
      }
    else {
      const clickedElement = event.target as HTMLElement;
      const isWithinPongCard = isElementOrAncestor(clickedElement, 'pong-card');
      const isWithinConnectCard = isElementOrAncestor(clickedElement, 'connect-card');
      
      if (isWithinPongCard)
        showGameOptions('pong');
      else if (isWithinConnectCard)
        showGameOptions('connect');
    }
  })
}

function isElementOrAncestor(element: HTMLElement, id: string): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.id === id) { return true; }
      current = current.parentElement;
    }
    return false;
  }

function showGameOptions(game: string) {
  const optionsModal = document.getElementById('game-options-modal');
  if (!optionsModal) { return ; }
  optionsModal.classList.remove('hidden');

  const normalModeButton = document.getElementById('normal-button') as HTMLButtonElement;
  const customModeButton = document.getElementById('custom-button') as HTMLButtonElement;
  const normalModeOptions = document.getElementsByClassName('normal-modes')[0];
  const customModeOptions = document.getElementsByClassName('custom-modes')[0];
  if (!normalModeButton || !customModeButton || !normalModeOptions || !customModeOptions) { return ; }
  normalModeButton.onclick = () => {
    normalModeButton.classList.add('active');
    customModeButton.classList.remove('active');
    normalModeOptions.classList.remove('hidden');
    customModeOptions.classList.add('hidden');
  }
  customModeButton.onclick = () => {
    customModeButton.classList.add('active');
    normalModeButton.classList.remove('active');
    customModeOptions.classList.remove('hidden');
    normalModeOptions.classList.add('hidden');
  }

  const optionButtons = document.querySelectorAll('.option-button');
  optionButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      let target = event.target as HTMLElement;
      while (target && !target.classList.contains('option-button')) {
        target = target.parentElement as HTMLElement;
      }
      if (!target) { return; }
      
      const mode = target.getAttribute('data-mode');
      if (mode && game){
        if (game === "pong")
          navigateTo("/pong", { gameMode: mode, isCustom: mode.includes('custom') });
        else if (game === "connect")
          navigateTo("/4inrow", { gameMode: mode, isCustom: mode.includes('custom') });
      }
    });
  });
} 

let count = 1;

function showTournamentForm() {
  const tournamentForm = document.getElementById('tournament-form');
  const closeButton = document.getElementsByClassName('close-icon')[0] as HTMLButtonElement;
  const addAlias = document.getElementsByClassName('alias-icon')[0] as HTMLButtonElement;
  const addUser = document.getElementById('submit-user') as HTMLButtonElement;
  const createTournament = document.getElementById('start-tour') as HTMLButtonElement;
  const playerAlias = document.getElementById('player-alias') as HTMLInputElement;
  const username = localStorage.getItem('username');
  let host = document.getElementsByClassName('player')[0] as HTMLSpanElement;
  host.classList.add('user');

  if (!tournamentForm || !closeButton || !host) { return ; }
  host.innerText = username !== null ? username : 'Default';
  tournamentForm.classList.remove('hidden');
  closeButton.onclick = () => { closeForm(); };
  addAlias.onclick = () => { if (addPlayer(playerAlias.value, false)) playerAlias.value = ''; }
  addUser.onclick = async () => { await isUser(); }
  createTournament.onclick = () => { startTournament(); }
}

async function startTournament() {
  const tournamentTitle = document.getElementById('tour-title') as HTMLInputElement;
  const modeInputs = document.getElementsByClassName('game-option') as HTMLCollectionOf<HTMLInputElement>;
  const players = document.getElementsByClassName('player') as HTMLCollectionOf<HTMLSpanElement>;
  let playersObject: GamePlayer[] = [];
  if (!tournamentTitle || !modeInputs || !players) { return ; }

  try {
    if (!tournamentTitle.value) { throw new Error('Missing Tournament title'); }
    let gameMode;
    for (let i = 0; i < 4; i++) {
      if (modeInputs[i].checked)
        gameMode = modeInputs[i].value;
      
      if (players[i].innerText === 'Default')
        throw new Error('Not enough players');
      else {
        playersObject[i] = { username: "", isUser: false };
        playersObject[i].username = players[i].innerText;
        playersObject[i].isUser = players[i].classList.contains('user');
      }
    }
    if (!gameMode) { throw new Error('Select a Game Mode'); }
    
    console.log("Tournament title:", tournamentTitle.value);
    console.log("Game Mode of the Tournament:", gameMode);
    console.log("Starting tournament with players:", playersObject);

    const response = await sendRequest('POST', '/tournaments', {name: tournamentTitle.value, game_type: gameMode, users: playersObject});
    if (!response)
      throw new Error('Error while creating tournament');
    console.log(response);
    navigateTo('/tournament');
  }
  catch (error) {
    showAlert((error as Error).message, 'toast-error');
  }
}

function closeForm() {
  const tournamentForm = document.getElementById('tournament-form');
  const tournamentTitle = document.getElementById('tour-title') as HTMLInputElement;
  const modeInputs = document.getElementsByClassName('game-option') as HTMLCollectionOf<HTMLInputElement>;
  const addDropdown = document.getElementById('login-form') as HTMLButtonElement;
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const aliasInput = document.getElementById('player-alias') as HTMLInputElement;
  const players = document.getElementsByClassName('player') as HTMLCollectionOf<HTMLSpanElement>;
  if (!tournamentForm || !tournamentTitle || !modeInputs || !addDropdown || !usernameInput 
    || !passwordInput || !aliasInput || !players) { return ; }

  tournamentTitle.value = '';
  usernameInput.value = '';
  passwordInput.value = '';
  aliasInput.value = '';

  addDropdown.classList.add('hidden');

  for (let i = 0; i < 4; i++) {
    modeInputs[i].checked = false;
    players[i].innerText = 'Default';
    players[i].classList.remove('user');
  }

  tournamentForm.classList.add('hidden');
  count = 1;
}

async function isUser() {
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const username = usernameInput.value;
  const password = passwordInput.value;
  if (!username || !password) { return ; }
  
  try {
    const response = await sendRequest('POST', 'verify', {username, password});
    if (!response || response['error'])
      throw new Error(response['error']);
    if (addPlayer(username, true)) {
      usernameInput.value = '';
      passwordInput.value = '';
    }
  }
  catch (error) {
    showAlert((error as Error).message, 'toast-error');
  }
}

function addPlayer(playerName: string, isUser: boolean) {
  let players = document.getElementsByClassName('player') as HTMLCollectionOf<HTMLSpanElement>;
  let msg = '';
  if (!players || count > 3 || !playerName) { return (false); }
  for (let i = 0; i < 4; i++)
    if (playerName === players[i].innerText) { msg = 'Cannot use the same name twice';}
  if (playerName.length < 4)
    msg = 'Player Alias too short';
  else if (playerName.length > 16)
    msg = 'Player Alias too long';
  else if (!/^[a-z0-9]+$/.test(playerName))
    msg = 'Player Alias can only contain lowercase and digits';
  
  if (msg === '') {
    players[count].innerText = playerName;
    if (isUser)
      players[count].classList.add('user');
    count++;
    return (true);
  }
  
  showAlert(msg, "toast-error");
  return (false);
}
