import { getClientID } from "../messages/messages-page.js"
import { displayFriends, displayInvitations, showMatches, debounce, deleteFriend } from "../friends/friends-fetch.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { getTranslation } from "../functionalities/transcript.js";
import { FriendList } from "../types.js";
import { displayBlockPopUp } from "../friends/friends-page.js";

export let socketToast: WebSocket | null;
let toastTimeout: NodeJS.Timeout;

const toastFeatures = [
	{ type: "toast-error", icon: "error-icon" },
	{ type: "toast-success", icon: "check-icon" },
	{ type: "toast-info", icon: "info-icon" },
];

const updateFriendsList = debounce(() => {
	const friendListPage = document.getElementById("friend-list");
	if (!friendListPage)
		return;
	displayFriends();

}, 500);

async function handleProfileUpdate(sender_id: number) {
	try {
		const friendProfileTyped = await sendRequest('GET', `/users/friends/${sender_id}`) as FriendList;
		if (!friendProfileTyped)
			throw new Error("Error while fetching friend profile");

		const friendProfileDiv = document.getElementById("friend-profile");
		if (!friendProfileDiv)
			return;
		friendProfileDiv.innerHTML = ` 
			<div id="friend-data-${sender_id}" class="flex flex-col-reverse lg:flex-row justify-between items-center gap-4 w-full p-2.5">
				<div class="flex flex-col lg:ml-4">
					<p class="font-bold text-center lg:text-start">${getTranslation('modify_username')}<span id="friend-name" class="font-thin">${friendProfileTyped.username}</span></p>
					<p class="font-bold text-center lg:text-start">${getTranslation('modify_nick')}<span id="friend-nick" class="font-thin">${friendProfileTyped.alias}</span></p>
				<div id="friend-status" class="flex gap-2 justify-center lg:justify-start">
				${friendProfileTyped.is_online === 1 ?
				`<p>${getTranslation('friends_online')}</p><img src="../../resources/img/online.svg" alt="Online status">` :
				`<p>${getTranslation('friends_offline')}</p><img src="../../resources/img/offline.svg" alt="Offline status">`
			}
						</div>
							<p class="font-bold text-center lg:text-start">${getTranslation('modify_description')}<span id="friend-description" class="italic font-thin break-all">${friendProfileTyped.status}</span></p>
								<div class="flex justify-center gap-10 my-4">
									<button id="delete-friend" class="button p-2.5 rounded-[15px]">${getTranslation('friends_delete')}</button>
									<button id="block-friend" class="button p-2.5 rounded-[15px] bg-[var(--alert)]">${getTranslation('friends_block')}</button>
								</div>
							</div>
						<div class="flex flex-col items-center lg:mr-4">
					<img id="friend-profile-photo" class="rounded-full" src="${friendProfileTyped.avatar}" alt="Profile photo">
				</div>
			</div>
			<div id="friend-statistics" class="flex flex-col items-center p-4 gap-1 mt-4 rounded-[15px] w-full lg:w-9/12 bg-[#7d48778f]">
				<p class="font-bold text-center">${getTranslation('friends_pong_played')}<span class="font-thin">${friendProfileTyped.pong_games_played}</span></p>
				<p class="font-bold text-center">${getTranslation('friends_pong_wins')}<span class="font-thin">${friendProfileTyped.pong_games_won}</span></p>
				<p class="font-bold text-center">${getTranslation('friends_pong_losses')}<span class="font-thin">${friendProfileTyped.pong_games_lost}</span></p>
				<p class="font-bold text-center">${getTranslation('friends_connect_played')}<span class="font-thin">${friendProfileTyped.connect_four_games_played}</span></p>
				<p class="font-bold text-center">${getTranslation('friends_connect_wins')}<span class="font-thin">${friendProfileTyped.connect_four_games_won}</span></p>
				<p class="font-bold text-center">${getTranslation('friends_connect_losses')}<span class="font-thin">${friendProfileTyped.connect_four_games_lost}</span></p>
			</div>
		`
		friendProfileDiv.style.display = 'flex';
		const blockFriendButton = document.getElementById("block-friend");
		if (blockFriendButton)
			blockFriendButton.addEventListener("click", () => { displayBlockPopUp(sender_id.toString()) });

		const deleteFriendButton = document.getElementById("delete-friend");
		if (deleteFriendButton)
			deleteFriendButton.addEventListener("click", () => { deleteFriend(sender_id.toString()) });
	}
	catch (error) {
		console.error(error);
	}
}

export function createsocketToastConnection() {
	if (socketToast && socketToast.readyState !== WebSocket.CLOSED)
		socketToast.close();
	const userId = localStorage.getItem("id");
	if (!userId) {
		console.error("Can't connect to WebSocketToast");
		return;
	}
	try {
		socketToast = new WebSocket(`wss://${window.location.hostname}:8443/ws/toast`)
		if (!socketToast)
			return;
		socketToast.onopen = () => {
			let id = getClientID();
			if (id === -1)
				console.error("Invalid ID, cannot connect to back");
			else {
				if (!socketToast)
					return;
				socketToast.send(JSON.stringify({
					userId: id,
					action: "identify"
				}));
			}
		};
		socketToast.onmessage = async (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "friendRequest") {
					if (data.info === "request") {
						if (data.body) {
							showAlert(data.body, "toast-info");
							const invitationListPage = document.getElementById("invitation-list");
							if (!invitationListPage)
								return;
							if (!invitationListPage.classList.contains('hidden'))
								displayInvitations();
						}
					}
					else if (data.info === "confirmation") {
						const invitationListPage = document.getElementById("invitation-list");
						const friendListPage = document.getElementById("friend-list");
						if (invitationListPage)
							if (!invitationListPage.classList.contains('hidden'))
								displayInvitations();
							else if (friendListPage)
								displayFriends();
						const dataMatches = document.getElementById("search-friend");
						if (!dataMatches)
							return;
						const friendInput = document.getElementById("friend-input") as HTMLInputElement;
						showMatches(friendInput.value);
					}
					else if (data.info === "delete") {
						const friendListPage = document.getElementById("friend-list");
						if (!friendListPage)
							return;
						const friendProfile = document.getElementById("friend-profile");
						if (friendProfile)
							friendProfile.style.display = 'none';
						displayFriends();
						const dataMatches = document.getElementById("search-friend");
						if (!dataMatches)
							return;
						const friendInput = document.getElementById("friend-input") as HTMLInputElement;
						showMatches(friendInput.value);
					}
				}
				else if (data.type === "chatToast")
					showAlert(data.body, "toast-info");
				else if (data.type === "friendStatusUpdate")
					updateFriendsList();
				else if (data.type === "change_avatar" && data.avatar_url) {
					if (window.location.pathname === "/friends") {
						const avatar_container = document.getElementById(`friend-id-${data.sender_id}`) as HTMLElement;
						const sender_invitation_avatar = document.getElementById(`invitation-avatar-${data.sender_id}`) as HTMLImageElement
						if (avatar_container) {
							const friend_img = avatar_container.querySelector("#friend-avatar") as HTMLImageElement;
							if (friend_img)
								friend_img.src = data.avatar_url
						}
						else if (sender_invitation_avatar)
							sender_invitation_avatar.src = data.avatar_url
					}
					else if (window.location.pathname === "/messages") {
						const avatar_container = document.getElementById(`friend-avatar-${data.sender_id}`) as HTMLImageElement;
						const chat_container = document.getElementById("chat-friend-username") as HTMLElement
						if (avatar_container)
							avatar_container.src = data.avatar_url;
						if (chat_container.innerText === data.username) {
							const contact_picture = document.getElementById("contact-picture") as HTMLImageElement;
							contact_picture.src = data.avatar_url;
						}
					}
					else if (window.location.pathname === "/statistics") {
						const avatar_container = document.getElementsByClassName(`friend-avatar-${data.sender_id}`) as HTMLCollectionOf<HTMLImageElement>;
						if (avatar_container) {
							for (let i = 0; i < avatar_container.length; i++)
								avatar_container[i].src = data.avatar_url;
						}
					}
					else if (window.location.pathname === "/games") {
						const avatar_container = document.getElementsByClassName(`friend-avatar-${data.sender_id}`) as HTMLCollectionOf<HTMLImageElement>;
						if (avatar_container) {
							for (let i = 0; i < avatar_container.length; i++)
								avatar_container[i].src = data.avatar_url;
						}
					}
				}
				else if (data.type === "profile_update") {
					const invitationListPage = document.getElementById("invitation-list");
					const friendListPage = document.getElementById("friend-list");
					if (invitationListPage)
						if (!invitationListPage.classList.contains('hidden'))
							displayInvitations();
						else if (friendListPage)
							displayFriends();
					const dataMatches = document.getElementById("search-friend");
					if (!dataMatches)
						return;
					const friendInput = document.getElementById("friend-input") as HTMLInputElement;
					showMatches(friendInput.value);
					const friend_profile = document.getElementById(`friend-data-${data.sender_id}`)
					if (friend_profile)
						handleProfileUpdate(data.sender_id);
				}
				else if (data.type === "game") {
					if (data.info === "request") {
						async function handleAccept(data: any) {
							if (socketToast) {
								socketToast.send(JSON.stringify({
									type: "game",
									info: "accept",
									sender_id: data.sender_id,
									receiver_id: data.receiver_id,
									game_type: data.game_type,
									is_custom: data.is_custom,
									chat_id: data.chat_id,
									sent_at: data.sent_at,
								}));
								sendRequest(`PATCH`, `messages/${data.message_id}`, { invitation_status: "accept" });
							}
						}
						function handleReject(data: any) {
							if (socketToast) {
								socketToast.send(JSON.stringify({
									type: "game",
									info: "reject",
									sender_id: data.sender_id,
									receiver_id: data.receiver_id,
									game_type: data.game_type,
									is_custom: data.is_custom,
									chat_id: data.chat_id,
									sent_at: data.sent_at
								}));
								sendRequest(`PATCH`, `messages/${data.message_id}`, { invitation_status: "reject" });
							}
						}
						showAlert(data.body, "toast-info", () => handleAccept(data), () => handleReject(data));
					}
				}
			}
			catch (err) {
				console.error("Error on message", err);
			}
		};
		socketToast.onerror = (error) => {
			console.error("WebsocketToast error:", error);
		};
		socketToast.onclose = () => {
			socketToast = null;
		};
	}
	catch (err) {
		console.error("Error creating WebsocketToast:", err);
	}
}

function defineToastFeatures(type: string) {
	const toast = document.getElementById("toast-default");
	const icon = document.getElementById("toast-icon");
	if (!toast || !icon)
		return;

	for (let i = 0; i < toastFeatures.length; i++) {
		if (toast.classList.contains(toastFeatures[i].type))
			toast.classList.remove(toastFeatures[i].type);
		if (icon.classList.contains(toastFeatures[i].icon))
			icon.classList.remove(toastFeatures[i].icon);

		if (toastFeatures[i].type === type) {
			toast.classList.add(toastFeatures[i].type);
			icon.classList.add(toastFeatures[i].icon);
		}
	}
}

export function displayToast() {
	const toastAlert = document.getElementById("toast-default");
	if (!toastAlert)
		return;

	toastAlert.addEventListener("click", (e: Event) => {
		const target = e.target as HTMLElement;
		if (target && target.classList.contains("close-icon")) {
			toastAlert.style.display = "none";
		}
	});
}

export function showAlert(msg: string, toastType: string, acceptCallback?: () => void, rejectCallback?: () => void) {
	const toastText = document.getElementById("toast-message");
	const toastAlert = document.getElementById("toast-default");
	const acceptButton = document.getElementById("accept-button");
	const rejectButton = document.getElementById("reject-button");

	if (!toastText || !toastAlert)
		return;
	defineToastFeatures(toastType);
	toastText.innerText = msg;
	if (acceptButton && rejectButton) {
		if (acceptCallback && rejectCallback) {
			acceptButton.classList.remove("hidden");
			rejectButton.classList.remove("hidden");

			// Add event listeners
			acceptButton.onclick = function () {
				acceptCallback();
				toastAlert.classList.add('hidden');
				toastAlert.style.display = "none";
			};

			rejectButton.onclick = function () {
				rejectCallback();
				toastAlert.classList.add('hidden');
				toastAlert.style.display = "none";
			};
		} else {
			acceptButton.classList.add('hidden');
			rejectButton.classList.add('hidden');
		}
	}
	toastAlert.classList.remove('hidden');
	toastAlert.style.display = "flex";
	if (toastTimeout)
		clearTimeout(toastTimeout);
	toastTimeout = setTimeout(() => {
		toastAlert.style.display = "none";
	}, 5000);
}
