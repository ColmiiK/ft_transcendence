import { initHomeEvents } from "./home-page/home-page.js";
import { sendRequest } from "./login-page/login-fetch.js";
import { initLoginEvents } from "./login-page/login-page.js";
import { initMessagesEvents, socketChat } from "./messages/messages-page.js";
import { initResetPasswordEvents } from "./reset-password-page/reset-password.js";
import { initTwoFactorEvents } from "./two-factor-page/two-factor.js";
import { initFriendsEvents } from "./friends/friends-page.js"
import { initSettingsEvents } from "./settings-page/settings-page.js"
import { LoginObject, MessageObject, User, GameInfo, ResetPassword } from "./types.js";
import { displayToast, createsocketToastConnection, socketToast } from "./toast-alert/toast-alert.js";
import { classicPong } from "./games/pong/classicPong.js"
import { chaosPong } from "./games/pong/chaosPong.js";
import { classicMode } from "./games/connectFour/classicMode.js";
import { crazyTokensMode } from "./games/connectFour/crazyTknsMode.js";
import { initTournamentEvents } from "./tournament/tournament.js";
import { initSelectPageEvent } from "./games/select-game-page.js";
import { initModifyPageEvents } from "./modify-profile/modify-page.js";
import { initStatsEvents } from "./statistics/stats-page.js";
import { applyTranslation } from "./functionalities/transcript.js";

if (!localStorage.getItem('inGame'))
	localStorage.setItem('inGame', 'false');
if (!localStorage.getItem('whichGame'))
	localStorage.setItem('whichGame', '');

const routes = [
	{
		path: "/",
		url: "../src/login-page/login-page.html",
		accesible: true,
		event: () => {
			initLoginEvents()
		}
	},
	{
		path: "/home",
		url: "../src/home-page/home-page.html",
		accesible: false,
		event: () => {
			initHomeEvents();
		}
	},
	{
		path: "/reset-password",
		url: "../src/reset-password-page/reset-password.html",
		accesible: true,
		event: (data: object) => {
			initResetPasswordEvents(data as ResetPassword);
		}
	},
	{
		path: "/two-factor",
		url: "../src/two-factor-page/two-factor.html",
		accesible: true,
		event: (data: object) => {
			initTwoFactorEvents(data as LoginObject);
		}
	},
	{
		path: "/messages",
		url: "../src/messages/messages-page.html",
		accesible: false,
		event: (data: object) => {
			initMessagesEvents(data as MessageObject);
		}
	},
	{
		//cambios para implementar la opcion de menu al seleccionar los juegos
		path: "/games",
		url: "../src/games/select-game-page.html",
		accesible: false,
		event: () => {
			initSelectPageEvent();
		}
	},
	{
		path: "/friends",
		url: "../src/friends/friends-page.html",
		accesible: false,
		event: (data: object) => {
			initFriendsEvents(data as User);
		}
	},
	{
		path: "/statistics",
		url: "../src/statistics/statistics-page.html",
		accesible: false,
		event: () => {
			initStatsEvents();
		}
	},
	{
		path: "/settings",
		url: "../src/settings-page/settings-page.html",
		accesible: false,
		event: () => {
			initSettingsEvents();
		}
	},
	{
		path: "/modify-profile",
		url: "../src/modify-profile/modify-page.html",
		accesible: false,
		event: () => {
			initModifyPageEvents();
		}
	},
	{
		path: "/tournament",
		url: "../src/tournament/tournament.html",
		accesible: false,
		event: () => {
			initTournamentEvents();
		}
	},
	{
    	path: "/pong",
    	url: "../src/games/pong/pong.html",
		accesible: false,
    	event: (data: object) => {
      		const mode = data as GameInfo;
			if (mode.is_custom || localStorage.getItem(`gameStatecustom`))
				chaosPong(mode);
			else if (!mode.is_custom || localStorage.getItem(`gameStateclassic`))
				classicPong(mode);
    	}
	},
 	{
		path: "/4inrow",
    	url: "../src/games/connectFour/connectFour.html",
		accesible: false,
    	event: (data: object) => {
			const mode = data as GameInfo;
			if (mode.is_custom || localStorage.getItem(`connect4GameStatecustom`))
				crazyTokensMode(mode);
			else if (!mode.is_custom || localStorage.getItem(`connect4GameStateclassic`))
				classicMode(mode);
    	}
	},
	{
		path: "/404",
    	url: "../src/404/404-page.html",
		accesible: true,
    	event: () => {}
	},
];

export function navigateTo(path: string, data: object = {}) {
    let route = routes.find(r => r.path === path);
    if (!route) {
        path = "/404";
        route = routes.find(r => r.path === "/404");
    }
        
    if (route) {
		if (path === '/pong') { localStorage.setItem('inGame', 'true'); localStorage.setItem('whichGame', 'pong'); }
		else if (path === '/4inrow') { localStorage.setItem('inGame', 'true'); localStorage.setItem('whichGame', '4inrow'); }
		else { localStorage.setItem('inGame', 'false'); }
        const screen = document.getElementsByClassName("screen-set")[0];
        if (screen) {
          screen.classList.add("fade-out");

          setTimeout(() => {
            history.pushState({}, "", path);
            if (socketToast && path === "/")
              socketToast.close();
            loadContent(path, data);
          }, 150); 
        } 
        else {
          history.pushState({}, "", path);
          if (socketToast && path === "/")
            socketToast.close();
          loadContent(path, data);
        }
    }
}

async function loadContent(path: string, data: object = {}) {
    try {
        let route = routes.find(r => r.path === path);
        if (!route || route === undefined) {
            route = routes.find(r => r.path === "/404");
            if (!route)
                throw "404 route not defined";
        }
        
        if (route.url) {
            const response = await fetch(route.url);
            const content = await response.text();
            const app = document.getElementById("app");
            if (app)
                app.innerHTML = content;
        }
        
		applyTranslation();
        route.event(data);
    }
    catch (error) {
        console.error("Error:", error);
    }
}

async function initBaseEvents() {
	try {
		const response = await fetch("../src/toast-alert/toast-alert.html");
		const content = await response.text();
		const base = document.getElementById("base");
		if (base)
			base.innerHTML = content;
		displayToast();
	}
	catch (error) {
		console.error("Error while charging the page:", error);
	}
}

window.onpopstate = async () => {
	if (socketChat)
		socketChat.close();

	let currentPath = window.location.pathname;
	if (localStorage.getItem('inGame') === 'true') {
		if (localStorage.getItem('whichGame') === 'pong')
			history.pushState({}, "", '/pong');
		else if (localStorage.getItem('whichGame') === '4inrow')
			history.pushState({}, "", '/4inrow');
		return ;
	}
	else if (localStorage.getItem('inGame') === 'false' && (currentPath === '/pong' || currentPath === '/4inrow')) {
		currentPath = '/games';
		history.pushState({}, "", currentPath);
	}
	
	const validRoute = routes.find(r => r.path === currentPath);
	if ((!validRoute?.accesible && !(await checkLogged()))
		|| (await checkLogged() && currentPath === "/")) 
		return ;
	loadContent(currentPath);
};

document.addEventListener("DOMContentLoaded", async () => {
  initBaseEvents();
  
  let currentPath = window.location.pathname;
  const validRoute = routes.find(r => r.path === currentPath);
  
  if (!validRoute) {
	if (localStorage.getItem('inGame') === 'true') {
		let currentPath = '/' + localStorage.getItem('whichGame');
		history.pushState({}, "", currentPath);
		loadContent(currentPath);
	}
	else {
		history.pushState({}, "", "/404");
		loadContent("/404");
	}
  } 
  else {
    let data = {};
    if (currentPath === "/reset-password") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const id = urlParams.get('id');
      if (token && id) {
        data = { token, id };
      }
    }
    
	if (!validRoute.accesible && !(await checkLogged())) 
		currentPath = "/";
	if (await checkLogged() && currentPath === "/")
		currentPath = "/home";
    if (currentPath !== "/" && currentPath !== "/reset-password" && currentPath !== "/two-factor" && currentPath !== "/404")
      createsocketToastConnection();
	if (localStorage.getItem('inGame') === 'true')
		currentPath = '/' + localStorage.getItem('whichGame');
	else if (localStorage.getItem('inGame') === 'false' && (currentPath === '/pong' || currentPath === '/4inrow'))
		currentPath = '/games';
	
	history.pushState({}, "", currentPath);
    loadContent(currentPath, data);
  }
});

export async function checkLogged() {
	const username = localStorage.getItem("username");
	if (!username)
		return (false);
	try {
		const res = await sendRequest("GET", "/islogged");
		if (!res)
			throw new Error("Problem checking if the user is logged");
		if (res["logged"])
			return (true);
		else
			return (false);
	}
	catch (error) {
		console.error("Error:", error);
	}
}

declare global {
	interface String {
		capitalize(): string;
	}
}
String.prototype.capitalize = function (): string {
	return this.charAt(0).toUpperCase() + this.slice(1);
};
export {};