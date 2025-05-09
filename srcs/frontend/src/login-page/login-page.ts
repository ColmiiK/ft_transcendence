"use strict";

import { initLoginFetches } from "./login-fetch.js";
import { sendRequest } from "./login-fetch.js";

export async function initLoginEvents() {
	dropDown();
	switchSigns();
	resetPassword();
	initLoginFetches();
	googleSignIn();
  const res = await sendRequest("GET", "/islogged");
  if (res["logged"]) {
    console.log("JWT found, user is already logged");
  } else {
    console.log("JWT not found, user is not logged");
  }
}

export function dropDown(){
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
	else
		dropdownButton.innerText = language.label;
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
	const visualDiv = document.getElementById("visual-div");
	resetPassButton.addEventListener("click", () => {
		popUp();
		if (visualDiv)
			visualDiv.style.opacity = "0.5";
		const form = document.getElementById("login-form") as HTMLFormElement;
		if (form)
			form.reset();
	});
	resetPasswordDialog.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		if (target.classList.contains("close-icon")) {
			if (visualDiv)
				visualDiv.style.opacity = "1";
			resetPasswordDialog.style.display = "none";
			resetPasswordDialog.close();
		}
	});
}

function popUp() {
	const resetPassword = document.getElementById("recover-password") as HTMLDialogElement;
	if (!resetPassword)
		return;
	resetPassword.style.display = "flex";
	resetPassword.showModal();
}

function googleSignIn() {
	var s = document.createElement( 'script' );
	s.setAttribute( 'src', "https://accounts.google.com/gsi/client" );
	document.body.appendChild( s );
};
