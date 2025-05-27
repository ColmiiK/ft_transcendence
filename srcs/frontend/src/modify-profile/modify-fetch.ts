import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { Profile } from "../types.js"
import { getTranslation } from "../functionalities/transcript.js";

export function initModifyFetchEvents() {
	initData();
}

async function initData() {
	const avatar = document.getElementById("modify-profile-photo") as HTMLImageElement;
	const username = document.getElementById("your-name");
	const nickname = document.getElementById("your-nick");
	const description = document.getElementById("your-description");
	const creationDate = document.getElementById("your-creation-date");
	const totalWins = document.getElementById("your-wins");
	const totalLosses = document.getElementById("your-losses");
	if (!avatar || !username || !nickname || !description || !creationDate || !totalWins || !totalLosses) { return ; }

	try {
		const response = await sendRequest('GET', '/users/profile') as Profile;
		if (!response)
			throw new Error("Error while fetching profile data");

		avatar.src = response.avatar;
		username.innerText = response.username;
		if (response.nick)
			nickname.innerText = response.nick;
		description.innerText = response.description;
		creationDate.innerText = response.created_at.substring(0, 10);
		totalWins.innerText = response.wins;
		totalLosses.innerText = response.losses;
		return ;
	}
	catch (error) {
		console.error(`Error: `, error);
		return ;
	}
}

export async function updatePhoto(image: File){
	try {
		const formData = new FormData();
		formData.append('file', image);

		const response = await fetch(`https://${window.location.hostname}:8443/api/avatars`, {
			method: 'POST',
			body: formData,
		});
		if (!response || !response.ok)
			throw new Error("Error while updating the avatar photo");

		const data = await response.json();
		localStorage.setItem('avatar', data.data_url);

		const profilePhoto = document.getElementById("modify-profile-photo") as HTMLImageElement;
		if (profilePhoto)
			profilePhoto.src = data.data_url;
		return data.data_url;
	}
	catch (error) {
		showAlert((error as Error).message , "toast-error");
		return (null);
	}
}

export async function uploadCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
	let image = canvas.toDataURL();

	try {
		const response = await sendRequest('PATCH', '/users', {avatar: image});
		if (!response)
			throw new Error("Error while updating the avatar from canvas");
		localStorage.setItem('avatar', response.avatar);

		const profilePhoto = document.getElementById("modify-profile-photo") as HTMLImageElement;
		if (profilePhoto)
			profilePhoto.src = response.avatar;
		return (response.avatar);
	}
	catch (error) {
		showAlert((error as Error).message , "toast-error");
		return (null);
	}
}

export async function updateNick(nickname: string) {
	try {
		if (!nickname)
			throw new Error(getTranslation('modify_empty_nickname'));
		const response = await sendRequest('PATCH', '/users', {alias: nickname});
		if (!response)
			throw new Error("Error while updating nickname");
		localStorage.setItem('alias', nickname);
		return ;
	}
	catch (error) {
		showAlert((error as Error).message , "toast-error");
		return ;
	}
}

export async function updateDescription(description: string) {
	try {
		if (!description)
			throw new Error(getTranslation('modify_empty_description'));
		const response = await sendRequest('PATCH', '/users', {status: description});
		if (!response)
			throw new Error("Error while updating description");
		localStorage.setItem('status', description);
		return ;
	}
	catch (error) {
		showAlert((error as Error).message , "toast-error");
		return ;
	}
}
