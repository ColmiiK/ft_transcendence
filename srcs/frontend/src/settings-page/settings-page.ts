import { dropDown } from "../login-page/login-page.js"
import { fetchDisplayTerms } from "../login-page/login-fetch.js"
import { moveBetweenInputs } from "../two-factor-page/two-factor.js";
import { closeModal } from "../friends/friends-page.js";
import { moveToHome } from "../messages/messages-page.js";
import { initSettingsFetch, displayQR, displayBlockedAccounts } from "./settings-fetch.js";
import { getTranslation } from "../functionalities/transcript.js";

export function initSettingsEvents() {
	dropDown();
	displayTerms();
	moveBetweenInputs();
	initButtons();
	moveToHome();
	initSettingsFetch();
	changedWindowSize();

	window.addEventListener("resize", changedWindowSize);
	const returnButtons = document.getElementsByClassName("back-button") as HTMLCollectionOf<HTMLButtonElement>;
	if (!returnButtons) { return ; }
	for (let i = 0; i < returnButtons.length; i++) {
		returnButtons[i].onclick = () => { toggleMobileDisplay(i); };
	}
}

function changedWindowSize() {
	const settingsDiv = document.getElementById("settings-div");
	const changePassword = document.getElementById("change-password");
	const twoFactor = document.getElementById("two-factor");
	const blockedAccounts = document.getElementById("blocked-accounts");
	if (!settingsDiv || !changePassword || !twoFactor || !blockedAccounts) { return ; }

	if (window.innerWidth > 1280) {
		settingsDiv.classList.remove("hidden");
		changePassword.classList.add("hide");
		twoFactor.classList.add("hide");
		blockedAccounts.classList.add("hide");

		changePassword.classList.remove("hidden");
		twoFactor.classList.remove("hidden");
		blockedAccounts.classList.remove("hidden");

		settingsDiv.classList.remove("animate__fadeInRight");
		changePassword.classList.remove("animate__fadeInLeft");
		twoFactor.classList.remove("animate__fadeInLeft");
		blockedAccounts.classList.remove("animate__fadeInLeft");
		
		settingsDiv.classList.remove("animate__fadeOutRight");
		changePassword.classList.remove("animate__fadeOutLeft");
		twoFactor.classList.remove("animate__fadeOutLeft");
		blockedAccounts.classList.remove("animate__fadeOutLeft");
	}
	else {
		settingsDiv.classList.remove("hidden");
		changePassword.classList.add("hidden");
		twoFactor.classList.add("hidden");
		blockedAccounts.classList.add("hidden");

		changePassword.classList.remove("hide");
		twoFactor.classList.remove("hide");
		blockedAccounts.classList.remove("hide");

		changePassword.classList.add("animate__fadeInLeft");
		twoFactor.classList.add("animate__fadeInLeft");
		blockedAccounts.classList.add("animate__fadeInLeft");
	}
	settingsDiv.classList.remove("slide-left");
	settingsDiv.onanimationend = () => {};
}

function toggleMobileDisplay(option: number) {
	const changePassword = document.getElementById("change-password") as HTMLButtonElement;
	const twoFactor = document.getElementById("two-factor") as HTMLButtonElement;
	const blockedAccounts = document.getElementById("blocked-accounts") as HTMLButtonElement;
	const settingsDiv = document.getElementById('settings-div');
	if (!changePassword || !twoFactor || !blockedAccounts || !settingsDiv)
		return ;
	
	const arrayOptions = [ changePassword, twoFactor, blockedAccounts]; 
	if (arrayOptions) { 
		arrayOptions[option].classList.add('animate__fadeOutLeft');
		settingsDiv.style.position = 'absolute';
		settingsDiv.classList.add("animate__fadeInRight");
		settingsDiv.classList.remove('hidden');
		settingsDiv.onanimationend = () => {};
		arrayOptions[option].onanimationend = () => {
			settingsDiv.style.position = 'static';
			arrayOptions[option].classList.add('hidden');
			arrayOptions[option].style.position = 'absolute';
			arrayOptions[option].classList.remove('animate__fadeOutLeft');
		};
	}
}

function initButtons() {
	const changePasswordButton = document.getElementById("change-password-button") as HTMLButtonElement;
	const twoFactorButton = document.getElementById("two-factor-button") as HTMLButtonElement;
	const blockedAccountsButton = document.getElementById("blocked-accounts-button") as HTMLButtonElement;
	const deleteAccountButton = document.getElementById("delete-account-button") as HTMLButtonElement;
	if (!changePasswordButton || !twoFactorButton || !blockedAccountsButton || !deleteAccountButton)
		return ;

	changePasswordButton.onclick = () => { displayOption(0) };
	twoFactorButton.onclick = () => { displayOption(1), displayQR() };
	blockedAccountsButton.onclick = () => { displayOption(2), displayBlockedAccounts() };
	deleteAccountButton.onclick = () => { displayDeletePopUp() };
}

function displayOption(option: number) {
	if (window.innerWidth > 1280)
		resetOptions();
	const changePassword = document.getElementById("change-password") as HTMLButtonElement;
	const twoFactor = document.getElementById("two-factor") as HTMLButtonElement;
	const blockedAccounts = document.getElementById("blocked-accounts") as HTMLButtonElement;
	const settingsDiv = document.getElementById('settings-div');
	if (!changePassword || !twoFactor || !blockedAccounts || !settingsDiv)
		return ;
	
	const arrayOptions = [ changePassword, twoFactor, blockedAccounts]; 
	if (arrayOptions) {
		if (window.innerWidth > 1280) {
			settingsDiv.classList.add('slide-left');
			arrayOptions[option].classList.remove('hide');
		}
		else {
			settingsDiv.classList.add('animate__fadeOutRight');
			arrayOptions[option].classList.remove('hidden');
			settingsDiv.onanimationend = () => {
				settingsDiv.classList.add('hidden');
				settingsDiv.classList.remove('animate__fadeOutRight');
				arrayOptions[option].style.position = 'static';
				arrayOptions[option].onanimationend = () => {};
			};
		}
	}
}

function resetOptions() {
	const changePassword = document.getElementById("change-password") as HTMLButtonElement;
	const twoFactor = document.getElementById("two-factor") as HTMLButtonElement;
	const blockedAccounts = document.getElementById("blocked-accounts") as HTMLButtonElement;
	const deleteAccount = document.getElementById("delete-account") as HTMLButtonElement;
	const settingsDiv = document.getElementById('settings-div');
	if (!changePassword || !twoFactor || !blockedAccounts || !deleteAccount || !settingsDiv)
		return ;
	
	const arrayOptions = [ changePassword, twoFactor, blockedAccounts, deleteAccount]; 
	if (arrayOptions) {
		arrayOptions.forEach(option => {
			settingsDiv.classList.remove('slide-left');
			option.classList.add('hide');
		});
	}
}

async function displayTerms() {
	const settingsPage = document.getElementById("settings-div");
	const termsButton = document.getElementById("terms-conditions-button");
	const termsPage = document.getElementById("terms-and-conditions");
	const changePassword = document.getElementById("change-password") as HTMLButtonElement;
	const twoFactor = document.getElementById("two-factor") as HTMLButtonElement;
	const blockedAccounts = document.getElementById("blocked-accounts") as HTMLButtonElement;
	await fetchDisplayTerms();

	if (!settingsPage || !termsButton || !termsPage || !changePassword || !twoFactor || !blockedAccounts)
		return ;
	termsButton.addEventListener("click", () => {
		resetOptions();
		if (!termsPage.style.display || termsPage.style.display === "none") {
			settingsPage.style.display = "none";
			termsPage.style.display = "flex";
			termsButton.innerText = "Settings";

			changePassword.classList.add('hidden');
			twoFactor.classList.add('hidden');
			blockedAccounts.classList.add('hidden');
		}
		else {
			settingsPage.style.display = "flex";
			termsPage.style.display = "none";
			termsButton.innerText = getTranslation('terms_policy');

			changePassword.classList.remove('hidden');
			twoFactor.classList.remove('hidden');
			blockedAccounts.classList.remove('hidden');
		}
	})
}

function displayDeletePopUp() {
	const deleteAccount = document.getElementById("delete-account") as HTMLDialogElement;
	const closeButton = document.getElementsByClassName("close-icon")[0] as HTMLButtonElement;
	if (!deleteAccount || !closeButton)
		return;
	deleteAccount.style.display = "flex";
	deleteAccount.showModal();

	closeButton.onclick = () => { closeModal(deleteAccount) };
}
