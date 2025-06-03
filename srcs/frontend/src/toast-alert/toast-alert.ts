import { getClientID } from "../messages/messages-page.js"
import { displayFriends, displayInvitations, showMatches, debounce } from "../friends/friends-fetch.js";
import { sendRequest } from "../login-page/login-fetch.js";

export let socketToast: WebSocket | null;
let toastTimeout: NodeJS.Timeout;

const toastFeatures = [
	{ type: "toast-error", icon: "error-icon" },
	{ type: "toast-success", icon: "check-icon" },
];

const updateFriendsList = debounce(() => {
	const friendListPage = document.getElementById("friend-list");
	if (!friendListPage)
		return;
	displayFriends();

}, 500);

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
							showAlert(data.body, "toast-success");
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
					showAlert(data.body, "toast-success");
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
						showAlert(data.body, "toast-success", () => handleAccept(data), () => handleReject(data));
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
