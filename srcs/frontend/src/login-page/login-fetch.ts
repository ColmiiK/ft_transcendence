import { showAlert } from "../toast-alert/toast-alert.js";
import { navigateTo } from "../index.js";
import { LoginObject } from "../types.js";
import { createsocketToastConnection } from "../toast-alert/toast-alert.js";
import { lang, setLang, getTranslation, applyTranslation } from "../functionalities/transcript.js";

/**
 * @brief Inits the associated Login Fetches and buttons
 * @note Export because it'll be called on login-page.js
 */
export function initLoginFetches() {
	const signupSubmit = document.getElementById("signup-form");
	const loginSubmit = document.getElementById("login-form");
	const recoverPasswordSubmit = document.getElementById("recover-password-form");

	if (!signupSubmit || !loginSubmit || !recoverPasswordSubmit)
		return;
	signupSubmit.addEventListener("submit", handleRegister);
	loginSubmit.addEventListener("submit", handleLogin);
	recoverPasswordSubmit.addEventListener("submit", recoverPassword);
	displayTerms();
}

/**
 * @brief Parses the auth forms before doing a fetch to assure everything is alright
 * @param email Default value on Login Form
 * @param confirmPassword Default value on Login Form
 * @returns Personalized msg for all cases
 */
export function parseSessionForm(
	username: string,
	password: string,
	email: string = "Default",
	confirmPassword: string = password
) {
	let msg: string = "Ok";

	if (!username || !email || !password || !confirmPassword)
		msg = getTranslation('fill_all_fields');
	else if (email !== "Default") {
		if (username.length < 4)
			msg = getTranslation('username_too_short');
		else if (username.length > 16)
			msg = getTranslation('username_too_long');
		else if (!/^[a-z0-9]+$/.test(username))
			msg = getTranslation('username_allowed_chars');
		else if (password !== confirmPassword)
			msg = getTranslation('passwords_not_match');
		else if (password.length < 9)
			msg = getTranslation('password_too_short');
		else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[*\.\-_]/.test(password))
			msg = getTranslation('password_musts');
	}

	return (msg);
}

/**
 * @brief Checks the Login form when sent
 * @param e Submit event refresh the page, including e allows you to prevent it
 */
async function handleLogin(e: Event) {
	e.preventDefault();
	const usernameField = document.getElementById("login-username") as HTMLInputElement;
	const passwordField = document.getElementById("password") as HTMLInputElement;
	if (!usernameField || !passwordField)
		return ;

	const username = usernameField.value;
	const password = passwordField.value;

	try {
    // DEBUG USER BYPASS
    const debugUsers = [ 
      "albagar4", "2albagar4",
      "alvegag", "2alvegag",
      "escastel", "2escastel",
      "ncruzg", "2ncruzg", ];
    if (!debugUsers.includes(username)) {
      const msg = parseSessionForm(username, password);
      if (msg !== "Ok")
        throw new Error(msg);
    }
    //TODO: REMOVE WHEN DEV IS DONE !!!

    // const msg = parseSessionForm(username, password);
    // if (msg !== "Ok")
    //   throw new Error(msg);
		const response = await sendRequest('POST', 'login', { username, password });
		if (!response["id"]) {
			if (response["twoFactor"] === "2FA is enabled, TOTP code required") {
				const data: LoginObject = { username, password };
				navigateTo("/two-factor", data);
			}
			else if ((response["error"] && response["error"].includes("User")) ||
				(response["error"] && response["error"].includes("password")) 
				|| response["authorization"] === 'failed')
					throw new Error(getTranslation('incorrect_inputs'));
			else
				throw new Error(response["error"]);
		}
		else {
			initSession(response);
		}
		const form = document.getElementById("login-form") as HTMLFormElement;
		if (form)
			form.reset();
		return (true);
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
		return (false);
	}
}

/**
 * @brief Stores in localStorage the data of the user who just logged
 * @param response The user data returned by the backend
 * @returns If everything ok navigates you to the Home Page
 */
export async function initSession(response: object) {
	Object.entries(response).forEach(([key, value])=> {
		if (typeof value !== 'object' || value === null)
			localStorage.setItem(key, String(value));
		else
			localStorage.setItem(key, JSON.stringify(value));
	});

	const savedLang = localStorage.getItem('language');
	if (savedLang)
		await setLang(savedLang);
	navigateTo("/home");
	createsocketToastConnection();
} 

/**
 * @brief Checks the Register form when sent
 * @param e Submit event refresh the page, including e allows you to prevent it
 * @returns true if user was created | false if not
 */
async function handleRegister(e: Event) {
	e.preventDefault();
	const usernameField = document.getElementById("username") as HTMLInputElement;
	const emailField = document.getElementById("signup-email") as HTMLInputElement;
	const passwordField = document.getElementById("new-password") as HTMLInputElement;
	const confirmPasswordField = document.getElementById("confirm-password") as HTMLInputElement;
	if (!usernameField || !emailField || !passwordField || !confirmPasswordField)
		return ;

	const username = usernameField.value;
	const email = emailField.value;
	const password = passwordField.value;
	const confirm_password = confirmPasswordField.value;

	try {
		const msg = parseSessionForm(username, password, email, confirm_password);
		if (msg !== "Ok")
			throw new Error(msg);

		const response = await sendRequest("POST", "register", {username, email, password, confirm_password, language: lang});
		if (response["error"]) {
			if (response["error"].includes("username"))
				throw new Error(getTranslation('username_exists'));
			else if (response["error"].includes("email"))
				throw new Error(getTranslation('email_exists'));
			else if (response["error"].includes("password"))
				throw new Error(getTranslation('password_not_valid'));
			else
				throw new Error(response["error"]);
		}
		else
			showAlert(getTranslation('user_success'), "toast-success");
		const form = document.getElementById("signup-form") as HTMLFormElement;
		if (form)
			form.reset();
		return (true);
	}
	catch (error) {
		showAlert((error as Error).message , "toast-error");
		return (false);
	}
}

/**
 * Standard function to make Requests to the backend
 * @param method 
 * @param endpoint 
 * @param body 
 * @param header 
 * @returns 
 */
export async function sendRequest(method: string, endpoint: string, body: object = {}, header: object = {}) {
	try {
		let response;
		
		// Object.keys return an array, which contains the property names of the object.
		if (Object.keys(body).length !== 0) {
			response = await fetch(`https://${window.location.hostname}:8443/api/${endpoint}`, {
				method,
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					...header
				},
				body: JSON.stringify(body)
			});
		}
		else {
			response = await fetch(`https://${window.location.hostname}:8443/api/${endpoint}`, {
				method,
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					...header
				},
			});
		}
		return await response.json();
	}
	catch (error) {
		console.error(`Error during fetch in ${method} ${endpoint}:`, error);
		return false;
	}
}


async function recoverPassword(e: Event) {
	e.preventDefault();
	const emailField = document.getElementById("email-password-recovery") as HTMLInputElement;
	if (!emailField)
		return ;

	const email = emailField.value;
	try {
		const response = await sendRequest('POST', 'reset', {email});
		if (response["error"])
			throw new Error(response["error"]);
		else {
			const msg = document.getElementById("recover-password-message") as HTMLElement;
			msg.innerText = getTranslation('email_sent_successfully');
		}
		const form = document.getElementById("recover-password-form") as HTMLFormElement;
		if (form)
			form.reset();

	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
	}
}

export async function fetchDisplayTerms() {
	try {
		let response;
		if (!localStorage.getItem('language') || localStorage.getItem('language') === 'en')
			response = await fetch(`../src/login-page/privacy-policy.html`);
		else if (localStorage.getItem('language') === 'es')
			response = await fetch(`../src/login-page/privacy-policy-es.html`);
		else
			response = await fetch(`../src/login-page/privacy-policy-fr.html`);
		const content = await response.text();
		const sectionCondition = document.querySelector("#privacy-policy");
		if (sectionCondition)
			sectionCondition.innerHTML = content;
	}
	catch (error) {
		console.error(`Error in fetchDisplayTerms`, error);
		return (false);
	}
}

async function displayTerms() {
	const signUpPage = document.getElementById("sign-up-page");
	const signInPage = document.getElementById("login-page");
	const termsButton = document.getElementById("terms-conditions-button");
	const termsPage = document.getElementById("terms-and-conditions");
	await fetchDisplayTerms();

	if (!signUpPage || !signInPage || !termsButton || !termsPage)
		return ;
	termsButton.addEventListener("click", () => {
		if (!termsPage.style.display || termsPage.style.display === "none") {
			signInPage.style.display = "none";
			signUpPage.style.display = "none";
			termsPage.style.display = "flex";
			termsButton.innerText = getTranslation('login_sign_in');
			termsButton.setAttribute('translatekey', 'login_sign_in');
		}
		else {
			signInPage.style.display = "flex";
			termsPage.style.display = "none";
			termsButton.innerText = getTranslation('terms_policy');
			termsButton.setAttribute('translatekey', 'terms_policy');
		}
	})
}

(window as any).handleGoogleLogin = async (response: object) => {
	try {
		const data = await sendRequest('POST', 'google/login', response);
		if (data["success"])
			initSession(data);
		else
			throw new Error(data["error"]);
	}
	catch (error) {
		console.log(error);
	}
}



