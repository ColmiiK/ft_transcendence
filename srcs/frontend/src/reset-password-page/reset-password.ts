import { showAlert } from "../toast-alert/toast-alert.js";
import { parseSessionForm, sendRequest } from "../login-page/login-fetch.js";
import { navigateTo } from "../index.js";
import { getTranslation } from "../functionalities/transcript.js";

export function initResetPasswordEvents() {
	moveToLogin();
	recoverPasswordFetches();
}

function moveToLogin() {
	const homeButton = document.getElementById("home-button");
	if (!homeButton)
		return;

	homeButton.addEventListener("click", () => {
		navigateTo("/login");
	});
}

function recoverPasswordFetches() {
	const resetPasswordSubmit = document.getElementById("reset-password-form");
	if (resetPasswordSubmit)
		resetPasswordSubmit.addEventListener("submit", resetPassword);
}

async function resetPassword(e: Event) {
	e.preventDefault();
	const params = new URLSearchParams(document.location.search);
	const token = params.get("token");
	const id = params.get("id");
	const passwordField = document.getElementById("first-password-recovery") as HTMLInputElement;
	const repeatPasswordField = document.getElementById("second-password-recovery") as HTMLInputElement;
	if (!passwordField || !repeatPasswordField)
		return;

	const password = passwordField.value;
	const repeatPassword = repeatPasswordField.value;
	try {
		const msg: string = parseSessionForm("username", password, "default@test.com", repeatPassword);
		if (msg !== "Ok")
			throw new Error(msg);

		const response = await sendRequest('POST', 'resetToken', {token: token, id: id, password: password, confirm_password: repeatPassword});
		if (response["success"]) {
			const passwordMessage = document.getElementById("reset-password-message");
			if (passwordMessage)
				passwordMessage.innerText = getTranslation('reset_success');
		}
		else
			throw new Error(response["error"]);
		const form = document.getElementById("reset-password-form") as HTMLFormElement;
		if (form)
			form.reset();
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
	}
}
