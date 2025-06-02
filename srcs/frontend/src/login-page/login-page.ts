"use strict";

import { initLoginFetches } from "./login-fetch.js";
import { checkLogged, navigateTo } from "../index.js"
import { setLang, applyTranslation } from "../functionalities/transcript.js";

export async function initLoginEvents() {
	const logged = await checkLogged();
	if (logged)
		navigateTo("/home");
	else {
		dropDown();
		switchSigns();
		resetPassword();
		initLoginFetches();
		googleSignIn();

		setTimeout(() => {
			const googleButton = document.getElementsByClassName("g_id_signin")[0];
			const loadingIcon = document.getElementsByClassName("animate-spin")[0];
			if (!googleButton || !loadingIcon) { return; }
			googleButton.classList.remove("opacity-0");
			loadingIcon.classList.add("hidden");
			googleButton.classList.add("googleButton");
		}, 500);
	}
}

export function dropDown() {
	const dropdownButton = document.getElementById("menu-button");
	const dropdownOptions = document.getElementById("language-options");
	if (!dropdownButton || !dropdownOptions)
		return;
	dropdownButton.addEventListener("click", () => {
		dropdownButton.focus();
	});
	dropdownButton.addEventListener("focus", () => {
		dropdownOptions.style.display = "block";
	});
	dropdownButton.addEventListener("blur", () => {
		dropdownOptions.style.display = "none";
	});
	dropdownOptions.addEventListener("mousedown", (e) => {
		const target = e.target as HTMLElement;
		const key = target.getAttribute('language_key');
		if (key)
			changeLanguage(key);
	});
}

function changeLanguage(option: string) {
	const dropdownButton = document.getElementById("menu-button");
	if (!dropdownButton)
		return;
	const languages = [
		{ key: 'es', label: 'Español' },
		{ key: 'en', label: 'English' },
		{ key: 'fr', label: 'Français' },
	];

	const language = languages.find((elem) => elem.key == option);
	if (!language || language === undefined)
		dropdownButton.innerText = "English";
	else {
		dropdownButton.innerText = language.label;
		setLang(language.key);
		applyTranslation();
	}
}


function switchSigns() {
	const signUpButton = document.getElementById("sign-up-button");
	const signInButton = document.getElementById("sign-in-button");
	const signUpPage = document.getElementById("sign-up-page");
	const signInPage = document.getElementById("login-page");

	if (!signUpButton || !signInButton || !signUpPage || !signInPage)
		return;

	signUpButton.addEventListener("click", () => {
		signInPage.style.display = "none";
		signUpPage.style.display = "flex";
		const form = document.getElementById("login-form") as HTMLFormElement;
		if (form)
			form.reset();
	});
	signInButton.addEventListener("click", () => {
		signInPage.style.display = "flex";
		signUpPage.style.display = "none";
		const form = document.getElementById("signup-form") as HTMLFormElement;
		if (form)
			form.reset();
	});
}


function resetPassword() {
	const resetPassButton = document.getElementById("forgot-password");
	const resetPasswordDialog = document.getElementById("recover-password") as HTMLDialogElement;
	if (!resetPassButton || !resetPasswordDialog)
		return;
	resetPassButton.addEventListener("click", () => {
		popUp();
		const form = document.getElementById("login-form") as HTMLFormElement;
		if (form)
			form.reset();
	});
	const closeButton = document.getElementsByClassName("close-icon")[0] as HTMLButtonElement;
	if (!closeButton) return;
	closeButton.onclick = () => {
		resetPasswordDialog.style.display = "none";
		resetPasswordDialog.close();
	};
}

function popUp() {
	const resetPassword = document.getElementById("recover-password") as HTMLDialogElement;
	if (!resetPassword)
		return;
	resetPassword.style.display = "flex";
	resetPassword.showModal();
}

function googleSignIn() {
	const googleSignIn = document.getElementById("google-script");
	if (googleSignIn)
		googleSignIn.remove();
	const userLang = window.navigator.language || 'en';
	const googleButton = document.getElementsByClassName("g_id_signin")[0];
	if (googleButton)
		googleButton.setAttribute('data-locale', userLang);
	var s = document.createElement('script');
	s.id = "google-script";
	s.setAttribute('src', `https://accounts.google.com/gsi/client`);
	document.body.appendChild(s);
};
