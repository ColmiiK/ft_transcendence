import { navigateTo } from "../index.js";
import { initTournamentFetches } from "./tournament-fetch.js";

export function initTournamentEvents() {
  const returnButton = document.getElementById('home-button') as HTMLButtonElement;
  if (!returnButton) { return ; }
  returnButton.onclick = () => { navigateTo('/games') };

  initTournamentFetches();
}