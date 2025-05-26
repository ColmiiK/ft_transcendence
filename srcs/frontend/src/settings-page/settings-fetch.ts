import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { navigateTo } from "../index.js";
import { Blocked } from "../types.js";
import { getTranslation } from "../login-page/login-transcript.js";

export function initSettingsFetch() {
	const changePasswordForm  = document.getElementById("change-password-form") as HTMLFormElement;
	if (changePasswordForm)
		changePasswordForm.addEventListener('submit', changePassword );

	const deleteAccountForm = document.getElementById("delete-account-form") as HTMLFormElement;
	if (deleteAccountForm)
		deleteAccountForm.addEventListener('submit', deleteAccount);

	const qrForm = document.getElementById("twoFA-code") as HTMLFormElement;
	if (qrForm)
		qrForm.addEventListener('submit', twoFactorAuth);
}

function parsePasswords(currentPassword: string, newPassword: string, confirmNewPassword: string): boolean {
	try {
		if (!currentPassword || !newPassword || !confirmNewPassword)
			throw new Error(getTranslation('fill_all_fields'));
		else if (newPassword !== confirmNewPassword)
			throw new Error(getTranslation('passwords_not_match'));
		else if (newPassword.length < 9)
			throw new Error(getTranslation('password_too_short'));
		else if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[*\.\-_]/.test(newPassword))
			throw new Error(getTranslation('password_musts'));
		return true;
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
		return false;
	}
}

async function changePassword(e: Event) {
	e.preventDefault();
	const currentPassword = document.getElementById("password") as HTMLInputElement;
	const newPassword = document.getElementById("new-password") as HTMLInputElement;
	const repeatPassword = document.getElementById("confirm-password") as HTMLInputElement;
	if (!currentPassword || !newPassword || !repeatPassword)
		return ;

	const currentPasswordValue = currentPassword.value;
	const newPasswordValue = newPassword.value;
	const repeatPasswordValue = repeatPassword.value;
	if (!parsePasswords(currentPasswordValue, newPasswordValue, repeatPasswordValue))
		return ;
	try {
		const response = await sendRequest('PATCH', 'users/password', { current_password: currentPasswordValue, new_password: newPasswordValue, new_password_confirm: repeatPasswordValue });
		if (!response["success"])
			throw new Error(response["error"]);
		else
			showAlert(getTranslation('settings_password_success'), "toast-success");
		const form = document.getElementById("change-password-form") as HTMLFormElement;
		if (form)
			form.reset();
		return ;
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
		return ;
	}
}

async function deleteAccount(e: Event) {
	e.preventDefault();
	const emailInput = document.getElementById("delete-email") as HTMLInputElement;
	const passwordInput = document.getElementById("delete-password") as HTMLInputElement;
	const deleteInput = document.getElementById("delete-confirm") as HTMLInputElement;

	if  (!emailInput || !passwordInput || !deleteInput)
		return ;

	const emailValue = emailInput.value;
	const passwordValue = passwordInput.value;
	const deleteValue = deleteInput.value;
	try {
		if (!emailValue || !passwordValue || !deleteValue)
			throw new Error(getTranslation('fill_all_fields'));
		else if (deleteValue !== "Delete")
			throw new Error(getTranslation('settings_wrong_delete'));
		const response = await sendRequest('DELETE', 'users', { email: emailValue, password: passwordValue, delete_input: deleteValue})
		if (!response["success"])
			throw new Error(response["error"]);
		else {
			showAlert(getTranslation('settings_delete_success'), "toast-success");
			displayDeletedAccount();
		}
		const form = document.getElementById("delete-account-form") as HTMLFormElement;
		if (form)
			form.reset();
		return ;
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
		return ;
	}
}

function displayDeletedAccount() {
	const deleteForm = document.getElementById("delete-account-form") as HTMLFormElement;
	const deleteMessage = document.getElementById("delete-account-message") as HTMLElement;
	const closeIcon = document.getElementsByClassName("close-icon")[0] as HTMLElement;
	const logOutButton = document.getElementById("log-out") as HTMLButtonElement;
	if (!deleteForm || !deleteMessage || !closeIcon || !logOutButton)
		return ;	
	deleteForm.style.display = "none";
	closeIcon.style.display = "none";
	deleteMessage.classList.add("text-center");
	deleteMessage.innerHTML = getTranslation('settings_delete_message');
	logOutButton.classList.remove("hidden");
	logOutButton.onclick = async () => {
    	localStorage.clear();
    	await sendRequest("GET", "/logout");
    	navigateTo('/login');
 	};
}

export async function displayQR() {
	if (localStorage.getItem("is_2fa_enabled") === "1") {
		const activateButton = document.getElementById("activate-button") as HTMLButtonElement;
		const deactivateButton = document.getElementById("deactivate-button") as HTMLButtonElement;
		activateButton.classList.add("hidden");
		deactivateButton.classList.remove("hidden");
		return ;
	}
	const qrImg = document.getElementById("QR-2FA") as HTMLImageElement;
	qrImg.classList.remove("hidden");

	try {
		const response = await sendRequest('GET', '2fa/enable');
		if (!response["qr_code"])
			throw new Error(response["error"]);
		else
			qrImg.src=response.qr_code;
		return ;
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
		return ;
	}
}

async function twoFactorAuth(e: Event) {
	e.preventDefault();
	const qrForm = document.getElementById("twoFA-code") as HTMLFormElement;
	const inputs = Array.from(document.getElementsByClassName("twoFA-input"));
	const valueCode = inputs.map(input => (input as HTMLInputElement).value).join("");
	try {
		if (!valueCode || valueCode.length < 6)
			throw new Error(getTranslation('fill_all_fields'));
		qrForm.reset();
		
		if (localStorage.getItem("is_2fa_enabled") === "1") {
			const response = await sendRequest('POST', '2fa/disable', {totp_code: valueCode});
			if (!response["success"])
				throw new Error(response["error"]);
			localStorage.setItem("is_2fa_enabled", "0");
			showAlert(getTranslation('settings_disable_2fa'), "toast-success");
		}
		else {
			const response = await sendRequest('POST', '2fa/verify', {totp_code: valueCode});
			if (!response["success"])
				throw new Error(response["error"]);
			localStorage.setItem("is_2fa_enabled", "1");
			showAlert(getTranslation('settings_enable_2fa'), "toast-success");
		}
		toggle2FA();
	}
	catch (error) {
		showAlert((error as Error).message, "toast-error");
	}
}

function toggle2FA() {
	const activateButton = document.getElementById("activate-button") as HTMLButtonElement;
	const deactivateButton = document.getElementById("deactivate-button") as HTMLButtonElement;
	const qrImg = document.getElementById("QR-2FA") as HTMLImageElement;
	if (!activateButton || !deactivateButton || !qrImg)
		return ;

	if (localStorage.getItem("is_2fa_enabled") === "1") {
		qrImg.classList.add("hidden");
		activateButton.classList.add("hidden");
		deactivateButton.classList.remove("hidden");
	}
	else {
		qrImg.classList.remove("hidden");
		displayQR();
		activateButton.classList.remove("hidden");
		deactivateButton.classList.add("hidden");
	}
}

export async function displayBlockedAccounts() {
	const blockedCard = document.getElementById("blocked-card");
	if (!blockedCard)
		return ;

	try {
		const response = await sendRequest('GET', 'users/blocks') as Blocked[];
		if (!response)
			throw new Error("Error getting blocked users");
		blockedCard.innerHTML = "";

		response.forEach((blocked) => {
			const card = document.createElement("div");
			card.setAttribute("id", "invitation-id");
			card.setAttribute("class", "friend-card");
			card.innerHTML = `
				<div class="flex items-center gap-4">
					<img id="invitation-avatar" class="card-avatar rounded-full m-1.5" src="../../resources/img/cat.jpg" alt="Avatar">
					<h3>${blocked.username}</h3>
				</div>
				<div id="blocked-id-${blocked.id}" class="blocked-user flex items-center m-1.5">
					<svg xmlns="http://www.w3.org/2000/svg" class="standard-icon add rounded-full" viewBox="0 -960 960 960">
						<path d="M240-640h360v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85h-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640Zm0 480h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Z"/>
					</svg>
				</div>
			`
			blockedCard.appendChild(card);
		});

		const unblockButtons = document.getElementsByClassName("blocked-user");
		if (unblockButtons?.length > 0) {
			for (const element of unblockButtons) {
				const blockedId = element.id.replace("blocked-id-", "");
				(element as HTMLButtonElement).onclick = () => { unblockUser(blockedId) };
			}
		}
	}
	catch(error) {
		showAlert((error as Error).message, "toast-error");
	}
}

async function unblockUser(blockedId: string) {
	try {
		const response = await sendRequest('PATCH', 'users/blocks', {blocked_id: blockedId});
		if (!response["success"])
			throw new Error(response["error"]);
		displayBlockedAccounts();
		showAlert(getTranslation('settings_unblock_success'), "toast-success");
	}
	catch(error) {
		showAlert((error as Error).message, "toast-error");
	}
}
