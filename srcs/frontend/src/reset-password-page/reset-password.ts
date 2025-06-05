import { showAlert } from "../toast-alert/toast-alert.js";
import { parseSessionForm, sendRequest } from "../login-page/login-fetch.js";
import { navigateTo } from "../index.js";
import { getTranslation } from "../functionalities/transcript.js";
import { ResetPassword } from "../types.js";

export function initResetPasswordEvents(data: ResetPassword) {
	moveToLogin();
	if (data && data.token && data.id) {
		recoverPasswordFetches(data);
	} else {
		showAlert(getTranslation('missing_reset_params') || 'Missing reset password parameters', "toast-error");
		setTimeout(() => navigateTo("/"), 3000);
	}
}

function moveToLogin() {
	const homeButton = document.getElementById("home-button");
	if (!homeButton)
		return;

	homeButton.addEventListener("click", () => {
		navigateTo("/");
	});
}

function recoverPasswordFetches(data: ResetPassword) {
	const resetPasswordSubmit = document.getElementById("reset-password-form");
	if (resetPasswordSubmit)
		resetPasswordSubmit.addEventListener("submit", (e) => resetPassword(e, data));
}

async function resetPassword(e: Event | null, data: ResetPassword) {
	if (!e || !data)
		return;
	e.preventDefault();
	const token = data.token;
	const id = data.id;
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
