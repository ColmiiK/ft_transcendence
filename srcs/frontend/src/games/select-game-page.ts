import { getTranslation } from "../functionalities/transcript.js";
import { navigateTo } from "../index.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { GamePlayer } from "../types.js"
let count = 1;

export function initSelectPageEvent(){
  count = 1;
  const homeButton = document.getElementById('home-button') as HTMLButtonElement;
  if (homeButton)
    homeButton.onclick = () => { navigateTo('/home'); };

  const pongCard = document.getElementById('pong-card');
  const connectCard = document.getElementById('connect-card');
  if (!pongCard || !connectCard) { return ; }
  pongCard.onclick = (event: Event) => { showModal(event) };
  connectCard.onclick = (event: Event) => { showModal(event) };

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

function showModal(event: Event) {
  const overlay = document.getElementById('overlay');
  const optionsModal = document.getElementById('game-options-modal');
  if (!overlay || !optionsModal) { return ; }
  overlay.style.zIndex = '10';
  optionsModal.classList.remove('hidden');

  const normalModeButton = document.getElementById('normal-button') as HTMLButtonElement;
  const customModeButton = document.getElementById('custom-button') as HTMLButtonElement;
  const normalModeOptions = document.getElementsByClassName('normal-modes')[0];
  const customModeOptions = document.getElementsByClassName('custom-modes')[0];

  normalModeButton.onclick = () => {
    normalModeButton.classList.add('active');
    customModeButton.classList.remove('active');
    normalModeOptions.classList.remove('hidden');
    customModeOptions.classList.add('hidden');
  }
  customModeButton.onclick = () => {
    normalModeButton.classList.remove('active');
    customModeButton.classList.add('active');
    normalModeOptions.classList.add('hidden');
    customModeOptions.classList.remove('hidden');
  }
  const clickedElement = event.target as HTMLElement;
  const isWithinPongCard = isElementOrAncestor(clickedElement, 'pong-card');
  const isWithinConnectCard = isElementOrAncestor(clickedElement, 'connect-card');
  if (isWithinPongCard)
    showGameOptions('pong');
  else if (isWithinConnectCard)
    showGameOptions('connect');

  overlay.onclick = (e: Event) => {
    const tournamentForm = document.getElementById('tournament-form');
    if (!isElementOrAncestor(e.target as HTMLElement, 'game-options-modal') &&
      tournamentForm?.classList.contains('hidden')) {
      overlay.style.zIndex = '-1';
      optionsModal.classList.add('hidden');
      normalModeButton.classList.add('active');
      customModeButton.classList.remove('active');
      normalModeOptions.classList.remove('hidden');
      customModeOptions.classList.add('hidden');

      const classicForm = document.getElementById('local-form');
      const customForm = document.getElementById('custom-local-form');
      classicForm?.classList.add('hidden');
      customForm?.classList.add('hidden');
      const aliasInputCustom = document.getElementById('custom-alias') as HTMLInputElement;
      const usernameInputCustom = document.getElementById('custom-username') as HTMLInputElement;
      const passwordInputCustom = document.getElementById('custom-password') as HTMLInputElement;
      aliasInputCustom.value = '';
      usernameInputCustom.value = '';
      passwordInputCustom.value = '';

      const aliasInputLocal = document.getElementById('local-alias') as HTMLInputElement;
      const usernameInputLocal = document.getElementById('local-username') as HTMLInputElement;
      const passwordInputLocal = document.getElementById('local-password') as HTMLInputElement;
      aliasInputLocal.value = '';
      usernameInputLocal.value = '';
      passwordInputLocal.value = '';
    }
  } 
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

  // Local with other players
  const hosts = document.getElementsByClassName('host');
  const username = localStorage.getItem('username');
  Array.from(hosts).forEach((host) => {
    (host as HTMLSpanElement).innerText = username || '';
  });
  const classicButton = document.getElementById('local-button') as HTMLButtonElement;
  const classicForm = document.getElementById('local-form');
  const classicStart = document.getElementById('start-classic') as HTMLButtonElement;
  classicButton.onclick = () => { classicForm?.classList.toggle('hidden') };
  classicStart.onclick = () => { validateGame(game, 'local') };
  
  const customButton = document.getElementById('custom-local-button') as HTMLButtonElement;
  const customForm = document.getElementById('custom-local-form');
  const customStart = document.getElementById('start-custom') as HTMLButtonElement;
  customButton.onclick = () => { customForm?.classList.toggle('hidden') };
  customStart.onclick = () => { validateGame(game, 'local-custom') };

  // Local with AI
  const aiButtons = document.querySelectorAll('.option-button');
  aiButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      let target = event.target as HTMLElement;
      while (target && !target.classList.contains('option-button')) {
        target = target.parentElement as HTMLElement;
      }
      if (!target) { return; }
      
      const mode = target.getAttribute('data-mode');
      if (mode && game) {
        if (game === "pong")
          navigateTo("/pong", { gameMode: mode, isCustom: mode.includes('custom') });
        else if (game === "connect")
          navigateTo("/4inrow", { gameMode: mode, isCustom: mode.includes('custom') });
      }
    });
  });

  // Option change
  normalModeButton.onclick = () => {
    normalModeButton.classList.add('active');
    customModeButton.classList.remove('active');
    normalModeOptions.classList.remove('hidden');
    customModeOptions.classList.add('hidden');
    customForm?.classList.add('hidden');
    const aliasInput = document.getElementById('custom-alias') as HTMLInputElement;
    const usernameInput = document.getElementById('custom-username') as HTMLInputElement;
    const passwordInput = document.getElementById('custom-password') as HTMLInputElement;
    aliasInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
  }
  customModeButton.onclick = () => {
    customModeButton.classList.add('active');
    normalModeButton.classList.remove('active');
    customModeOptions.classList.remove('hidden');
    normalModeOptions.classList.add('hidden');
    classicForm?.classList.add('hidden');
    const aliasInput = document.getElementById('local-alias') as HTMLInputElement;
    const usernameInput = document.getElementById('local-username') as HTMLInputElement;
    const passwordInput = document.getElementById('local-password') as HTMLInputElement;
    aliasInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
  }
}

async function validateGame(gameType: string, mode: string) {
  let aliasInput, usernameInput, passwordInput;

  if (mode === 'local') {
    aliasInput = document.getElementById('local-alias') as HTMLInputElement;
    usernameInput = document.getElementById('local-username') as HTMLInputElement;
    passwordInput = document.getElementById('local-password') as HTMLInputElement;
  }
  else {
    aliasInput = document.getElementById('custom-alias') as HTMLInputElement;
    usernameInput = document.getElementById('custom-username') as HTMLInputElement;
    passwordInput = document.getElementById('custom-password') as HTMLInputElement;
  }
  if (!aliasInput || !usernameInput || !passwordInput) { return ; }

  const alias = aliasInput.value;
  const username = usernameInput.value;
  const password = passwordInput.value;
  try {
    let playerName = '';
    if (alias) {
      if (username || password)
        throw new Error('Choose one option to fill');
      playerName = alias;
    }
    else {
      if (!username || !password)
        throw new Error(getTranslation('fill_all_fields'));

      const response = await sendRequest('POST', 'verify', {username, password});
      if (!response || response['error'])
        throw new Error(response['error']);
      playerName = username;
    }
    const msg = parsePlayer(playerName);
      if (msg !== '')
        throw new Error(msg);

    if (gameType === "pong")
      navigateTo("/pong", { gameMode: mode, isCustom: mode.includes('custom') });
    else if (gameType === "connect")
      navigateTo("/4inrow", { gameMode: mode, isCustom: mode.includes('custom') });
    
  }
  catch (error) {
    showAlert((error as Error).message, 'toast-error');
  }
}

function showTournamentForm() {
  const overlay = document.getElementById('overlay');
  const tournamentForm = document.getElementById('tournament-form');
  const closeButton = document.getElementsByClassName('close-icon')[0] as HTMLButtonElement;
  const addAlias = document.getElementsByClassName('alias-icon')[0] as HTMLButtonElement;
  const addUser = document.getElementById('submit-user') as HTMLButtonElement;
  const createTournament = document.getElementById('start-tour') as HTMLButtonElement;
  const playerAlias = document.getElementById('player-alias') as HTMLInputElement;
  const username = localStorage.getItem('username');
  let host = document.getElementsByClassName('player')[0] as HTMLSpanElement;
  host.classList.add('user');

  if (!overlay || !tournamentForm || !closeButton || !host) { return ; }
  host.innerText = username !== null ? username : 'Default';
  overlay.style.zIndex = '10';
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
  const overlay = document.getElementById('overlay');
  const tournamentForm = document.getElementById('tournament-form');
  const tournamentTitle = document.getElementById('tour-title') as HTMLInputElement;
  const modeInputs = document.getElementsByClassName('game-option') as HTMLCollectionOf<HTMLInputElement>;
  const addDropdown = document.getElementById('login-form') as HTMLButtonElement;
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const aliasInput = document.getElementById('player-alias') as HTMLInputElement;
  const players = document.getElementsByClassName('player') as HTMLCollectionOf<HTMLSpanElement>;
  if (!overlay || !tournamentForm || !tournamentTitle || !modeInputs || !addDropdown || !usernameInput 
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

  overlay.style.zIndex = '-1';
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
  msg = parsePlayer(playerName);
  
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

function parsePlayer(playerName: string) {
  let msg = '';
  const username = localStorage.getItem('username');
  if (username && username === playerName)
    msg = 'Cannot use the same name twice'
  if (playerName.length < 4)
    msg = 'Player Alias too short';
  else if (playerName.length > 16)
    msg = 'Player Alias too long';
  else if (!/^[a-z0-9]+$/.test(playerName))
    msg = 'Player Alias can only contain lowercase and digits';
  return (msg);
}
