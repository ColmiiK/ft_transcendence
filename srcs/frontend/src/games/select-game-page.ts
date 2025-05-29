import { navigateTo } from "../index.js";

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
  let host = document.getElementsByClassName('player')[0] as HTMLSpanElement;
  const playerAlias = document.getElementById('player-alias') as HTMLInputElement;
  const addAlias = document.getElementsByClassName('alias-icon')[0] as HTMLButtonElement;

  if (!tournamentForm || !closeButton || !host) { return ; }
  tournamentForm.classList.remove('hidden');
  closeButton.onclick = () => { tournamentForm.classList.add('hidden') };
  const username = localStorage.getItem('username');
  host.innerText = username !== null ? username : 'Default';
  addAlias.onclick = () => { addPlayer(playerAlias.value); }
}

function addPlayer(playerName: string) {
  let players = document.getElementsByClassName('player') as HTMLCollectionOf<HTMLSpanElement>;
  if (!players || count > 3 || !playerName) { return ; }
  players[count].innerText = playerName;
  count++;
}
