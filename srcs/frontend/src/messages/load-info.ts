import { sendRequest } from "../login-page/login-fetch.js";
import { LastMessage, Message, MessageObject, ChatInfo, UserMatches } from "../types.js"
import { debounce, emptyMatches } from "../friends/friends-fetch.js"
import { navigateTo } from "../index.js";
import { showAlert } from "../toast-alert/toast-alert.js";
import { displayMessage, getClientID, socketChat } from "./messages-page.js"
import { getTranslation } from "../functionalities/transcript.js";

export let actual_chat_id: number;

export function loadInfo(data: MessageObject) {
	dropDown();
	displayFirstChat(data);
	recentChats();
	const returnButton = document.getElementById("go-back-chat");
	if (returnButton)
		returnButton.addEventListener("click", () => {
			toggleMobileDisplay();
		});
	window.addEventListener("resize", changedWindowSize);

	// Search friend chats
	const searchForm = document.getElementById("search-chat-form") as HTMLFormElement;
	const friendInput = document.getElementById("friend-input") as HTMLInputElement;
	const searchFriend = document.getElementById("search-chat") as any;

	searchForm.onclick = (e: Event) => { e.preventDefault(); }

	document.addEventListener("click", (event) => {
		const target = event.target as Node;

		if (!searchForm.contains(target)) {
			friendInput.style.boxShadow = "";
			friendInput.value = "";
			searchFriend.innerHTML = "";
			searchFriend.style.display = 'none';
		}
	});
	friendInput.addEventListener("focusin", () => {
		searchFriend.style.display = 'block';
		friendInput.style.boxShadow = "0 0 0 max(100vh, 100vw) rgba(0, 0, 0, .3)";
	});
	friendInput.oninput = debounce(() => { showChats(friendInput.value) }, 500);
}

function dropDown() {
	const dropdownButton = document.getElementById("party-invitation");
	const dropdownOptions = document.getElementById("party-options");
	let isOpen = false;

	if (!dropdownButton || !dropdownOptions)
		return;
	dropdownButton.addEventListener("click", (e) => {
		e.stopPropagation();
		isOpen = !isOpen;
		dropdownOptions.style.display = isOpen ? "block" : "none";
	});
	document.addEventListener("click", () => {
		if (isOpen) {
			isOpen = false;
			dropdownOptions.style.display = "none";
		}
	});
	dropdownButton.addEventListener("focus", () => {
		dropdownOptions.style.display = "block";
	});
	dropdownButton.addEventListener("blur", () => {
		dropdownOptions.style.display = "none";
	});
	dropdownOptions.addEventListener("mousedown", (e) => {
		const target = e.target as HTMLElement;
		const key = target.getAttribute('profile_key');
		if (key)
			navigatePartyInvitations(key);
	});
}

async function navigatePartyInvitations(key: string) {
	const date = new Date();
	date.setHours(date.getHours() + 2);
	const keyMap = [
		{
			value: "classic-pong",
			title: "Classic Pong",
		},
		{
			value: "chaos-pong",
			title: "Chaos Pong",
		},
		{
			value: "classic-connect4",
			title: "Classic Connect4",
		},
		{
			value: "crazy-connect4",
			title: "Crazy-Tokens Connect4",
		}
	];
	const title = keyMap.find(r => r.value === key)?.title;

	const chatInfo = await getChatInfo(actual_chat_id);
	if (!chatInfo)
		return;
	const friendId = chatInfo.friend_id;
	const invitation = {
		body: `I want to play with you to ${title}!`,
		chat_id: actual_chat_id,
		receiver_id: friendId,
		sender_id: getClientID(),
		sent_at: date.toISOString(),
		info: "request",
		type: "game",
		game_type: key,
	} as Message;
	if (!socketChat)
		return;
	socketChat.send(JSON.stringify(invitation));
	if (invitation)
		displayMessage(invitation);
}

async function showChats(input: string) {
	const datalist = document.getElementById("search-chat");

	if (datalist) {
		emptyMatches(datalist);
		if (!input || input.length === 0)
			return;

		const matchesTyped = await sendRequest('POST', '/users/search', { username: input }) as UserMatches[];
		for (let i = 0; i < matchesTyped.length; i++) {
			if (matchesTyped[i].is_friend === 1) {
				let option = document.createElement('div');
				option.innerHTML = `${matchesTyped[i].username}`
				option.setAttribute("id", `friend-chat-${matchesTyped[i].user_id}`);
				option.classList.add("chat-option", "match-option");
				datalist.appendChild(option);
			}
			if (matchesTyped[i]) {
				const messageButton = document.getElementById(`friend-chat-${matchesTyped[i].user_id}`);
				if (messageButton) {
					const chat_id = await sendRequest('POST', '/chats/identify', { friend_id: matchesTyped[i].user_id });
					if (!chat_id)
						throw new Error("Error during fetch for navigating to friend chat");
					messageButton.onclick = () => {
						const friendInput = document.getElementById("friend-input") as HTMLInputElement;
						const searchFriend = document.getElementById("search-chat") as any;
						friendInput.style.boxShadow = "";
						friendInput.value = "";
						searchFriend.innerHTML = "";
						searchFriend.style.display = 'none';
						chargeChat(chat_id, matchesTyped[i].username, matchesTyped[i].avatar)
					};
				}
			}
		}

	}
}

function changedWindowSize() {
	const conversationList = document.getElementById("conversation-list");
	const conversationHistory = document.getElementById("conversation-history");
	const returnButton = document.getElementById("go-back-chat");
	if (conversationList && conversationHistory && returnButton) {
		if (window.innerWidth > 768) {
			conversationList.style.display = 'block';
			conversationHistory.style.display = 'flex';
			returnButton.style.display = 'none';
		}
		else {
			conversationList.style.display = 'block';
			conversationHistory.style.display = 'none';
			returnButton.style.display = 'none';
		}
	}
}

function toggleMobileDisplay() {
	const conversationList = document.getElementById("conversation-list");
	const conversationHistory = document.getElementById("conversation-history");
	const returnButton = document.getElementById("go-back-chat");

	if (conversationList && conversationHistory && returnButton) {
		if (conversationList.style.display !== 'none') {
			conversationList.style.display = 'none';
			conversationHistory.style.display = 'flex';
			returnButton.style.display = 'flex';
		}
		else {
			returnButton.style.display = 'none';
			conversationHistory.style.display = 'none';
			conversationList.style.display = 'block';
			recentChats();
		}
	}
}

async function displayFirstChat(data: MessageObject) {
	if (window.innerWidth < 768)
		return;

	// Opens the most recent chat when navigated to messages page
	try {
		const recentChats = await sendRequest('GET', 'chats/last');
    console.log('recentChats:', recentChats)
		if (!recentChats)
			throw new Error("Error displaying the first chat");

		const recentChatsTyped = recentChats as LastMessage[];
		if (recentChatsTyped.length > 0) {
			if (Object.keys(data).length !== 0)
				chargeChat(data.chat_id, data.friend_username, data.friend_avatar);
			else
				chargeChat(recentChatsTyped[0].chat_id, recentChatsTyped[0].friend_username, recentChatsTyped[0].friend_avatar);
		}
	}
	catch (error) {
		console.error(error);
	}
}

// Misses some tests
export async function recentChats() {
	let last_chat = 0;
	const recentChatsDiv = document.getElementById("conversation-list");

	if (recentChatsDiv) {
		try {
			const recentChatsTyped = await sendRequest('GET', 'chats/last') as LastMessage[];
			if (!recentChatsTyped)
				throw new Error("Error fetching recent chats");
			const searchForm = document.getElementById("search-friend-chat");
			const chatEntries = recentChatsDiv.querySelectorAll('[class^="chat"],[class*=" chat"]')
			chatEntries.forEach(entry => {
				if (entry !== searchForm)
					entry.remove();
			});
			if (recentChatsTyped.length === 0)
				return ;
			last_chat = recentChatsTyped[0].chat_id;

			recentChatsTyped.forEach((chat) => {
				var subDiv = document.createElement('div');
				subDiv.classList.add('chat-card');

				let truncated = "";
				chat.body?.length > 10 ? truncated = chat.body.substring(0, 10) + "..." : truncated = chat.body;
				subDiv.innerHTML = `
				<div id="chat-${chat.chat_id} "class="flex items-center gap-2 recent-chat-card">
					<div id="chat-avatar">
						<img id="friend-avatar-${chat.friend_id}" class="rounded-full aspect-square" src="${chat.friend_avatar}" alt="Avatar">
					</div>
					<div class="chat-info overflow-hidden">
						<h3>${chat.friend_username}</h3>
						<p class="opacity-50 text-sm">${truncated}</p>
					</div>
				</div>
				`;
				recentChatsDiv.appendChild(subDiv);
				subDiv.addEventListener("click", () => {
					if (window.innerWidth < 768 || last_chat !== chat.chat_id) {
						last_chat = chat.chat_id;
						const friend_avatar = document.getElementById(`friend-avatar-${chat.friend_id}`) as HTMLImageElement;
						if (!friend_avatar) { return; }
						const chat_input = document.getElementById("chat-input") as HTMLInputElement;
						if (!chat_input) { return; }
						chat_input.value = "";
						chargeChat(chat.chat_id, chat.friend_username, friend_avatar.src);
					}
				});
			})
		}
		catch (error) {
			console.error(error);
		}
	}
}

async function displayFriendInfo(friend_username: string) {
	try {
		const response = await sendRequest('POST', '/users/getid', { username: friend_username });
		if (!response)
			throw new Error("Problem while fetching the id of the friend");

		const data = await sendRequest('POST', '/users/isfriends', { friend_id: response.user_id });
		if (!data)
			showAlert(getTranslation("messages_not_friend"), "toast-error");
		else
			navigateTo("/friends", response);
	}
	catch (error) {
		console.error("Error: ", error);
	}
}

export async function chargeChat(chat_id: number, friend_username: string, friend_avatar: string, page: number = 1) {
	if (window.innerWidth < 768 && page === 1)
		toggleMobileDisplay();

	if (page === 1 || (actual_chat_id !== chat_id && chat_id !== 0)) {
		currentPage = 1;
		hasMoreMessages = true;
		page = 1;
	}

	const chatDiv = document.getElementById("message-history");
	let contactName = document.getElementById("chat-friend-username");
	let contactAvatar = document.getElementById("contact-picture");

	if (contactName) contactName.innerText = friend_username;
	if (contactAvatar) {
		contactAvatar.setAttribute("src", friend_avatar);
		contactAvatar.onclick = () => { displayFriendInfo(friend_username) };
	}

	await getChatInfo(chat_id);
	if (chatDiv) {
		try {
			const chatHistoryTyped = await sendRequest("GET", `chats/${chat_id}?page=${page}`) as Message[];
			if (page === 1 && chatDiv.children.length > 0)
				chatDiv.innerHTML = "";
			if (!chatHistoryTyped) {
				if (page === 1) throw new Error("Error fetching the chat selected");
				else return false;
			}
			const prevScrollHeight = chatDiv.scrollHeight;
			const fragment = document.createDocumentFragment();

			chatHistoryTyped.forEach((message) => {
				let div = document.createElement("div");
				const username = localStorage.getItem("username");
				if (username) {
					const sent_at = message.sent_at.substring(11, 16);
					if (message.invitation_type === "message") {
						if (message.sender_username !== username) {
							div.setAttribute("id", "friend-message");
							div.innerHTML = `
						<div class="message friend-message">
							<p>${message.body}</p>
							<p class="hour">${sent_at}</p>
						</div>`;
						} else {
							div.setAttribute("id", "message");
							div.innerHTML = `<div class="message self-message">
							<p>${message.body}<\p>
							<p class="hour">${sent_at}</p>
						</div>`;
						}
					}
					else if (message.invitation_type && message.invitation_type === "game") {
						if (message.invitation_status && message.invitation_status === "pending") {
							if (message.sender_username === username) {
								div.setAttribute("id", "message");
								div.innerHTML = `<div class="message self-message">
									<p>${message.body}<\p>
									<p class="hour">${sent_at}</p>
								</div>`;
							}
							else if (message.receiver_id === getClientID()) {
								div.setAttribute("id", "self-message");
								div.innerHTML = `
                 <div class="message friend-message flex flex-col">
                    <p>${message.body}</p>
                    <p class="hour">${sent_at}</p>
                    <div class="game-actions flex gap-2 mt-2">
                        <button type="button" class="accept-btn px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors">
                            Accept
                        </button>
                        <button type="button" class="reject-btn px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors">
                            Reject
                        </button>
                    </div>
                </div>`;

								const acceptBtn = div.querySelector('.accept-btn') as HTMLButtonElement;
								const rejectBtn = div.querySelector('.reject-btn') as HTMLButtonElement;
								const game_type = message.game_type;
								acceptBtn?.addEventListener('click', (event) => {
									const date = new Date();
									date.setHours(date.getHours() + 2);
									event.preventDefault();
									if (socketChat) {
										socketChat.send(JSON.stringify({
											type: "game",
											info: "accept",
											game_type: game_type,
											sender_id: getClientID(),
											receiver_id: message.sender_id,
											body: "Game invitation accepted",
											chat_id: actual_chat_id,
											sent_at: date.toISOString(),
										}));
										acceptBtn.disabled = true;
										acceptBtn.textContent = "Accepted ✓";
										rejectBtn?.remove();
										acceptBtn.classList.add('bg-gray-500');
										sendRequest(`PATCH`, `messages/${message.message_id}`, { invitation_status: "accept" });
									}
								});
								rejectBtn?.addEventListener('click', (event) => {
									const date = new Date();
									date.setHours(date.getHours() + 2);
									event.preventDefault()
									if (socketChat) {
										socketChat.send(JSON.stringify({
											type: "game",
											info: "reject",
											game_type: game_type,
											sender_id: getClientID(),
											receiver_id: message.sender_id,
											body: "Game invitation rejected",
											chat_id: actual_chat_id,
											sent_at: date.toISOString(),
										}));
										rejectBtn.disabled = true;
										rejectBtn.textContent = "Rejected ✗";
										acceptBtn?.remove();
										rejectBtn.classList.add('bg-gray-500');
										sendRequest(`PATCH`, `messages/${message.message_id}`, { invitation_status: "reject" });
									}
								});
							}
						}
						else if (message.invitation_status && message.invitation_status === "accept") {
							if (message.sender_username === username) {
								div.setAttribute("id", "message");
								div.innerHTML = `<div class="message self-message">
									<p>${message.body}<\p>
									<p class="hour">${sent_at}</p>
								</div>`;
							}
							else if (message.receiver_id === getClientID()) {
								div.setAttribute("id", "self-message");
								div.innerHTML = `
                 <div class="message friend-message flex flex-col">
                    <p>${message.body}</p>
                    <p class="hour">${sent_at}</p>
                    <div class="game-actions flex gap-2 mt-2">
                        <button type="button" class="accept-btn px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors">
                            Accept
                        </button>
                        <button type="button" class="reject-btn px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors">
                            Reject
                        </button>
                    </div>
                </div>`;
								const acceptBtn = div.querySelector('.accept-btn') as HTMLButtonElement;
								const rejectBtn = div.querySelector('.reject-btn') as HTMLButtonElement;
								acceptBtn.disabled = true;
								acceptBtn.textContent = "Accepted ✓";
								rejectBtn?.remove();
								acceptBtn.classList.add('bg-gray-500');
							}
						}
						else if (message.invitation_status && message.invitation_status === "reject") {
							if (message.sender_username === username) {
								div.setAttribute("id", "message");
								div.innerHTML = `<div class="message self-message">
									<p>${message.body}<\p>
									<p class="hour">${sent_at}</p>
								</div>`;
							}
							else if (message.receiver_id === getClientID()) {
								div.setAttribute("id", "self-message");
								div.innerHTML = `
                 <div class="message friend-message flex flex-col">
                    <p>${message.body}</p>
                    <p class="hour">${sent_at}</p>
                    <div class="game-actions flex gap-2 mt-2">
                        <button type="button" class="accept-btn px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors">
                            Accept
                        </button>
                        <button type="button" class="reject-btn px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors">
                            Reject
                        </button>
                    </div>
                </div>`;
								const acceptBtn = div.querySelector('.accept-btn') as HTMLButtonElement;
								const rejectBtn = div.querySelector('.reject-btn') as HTMLButtonElement;
								rejectBtn.disabled = true;
								rejectBtn.textContent = "Rejected ✗";
								acceptBtn?.remove();
								rejectBtn.classList.add('bg-gray-500');
							}
						}
					}
				}
				fragment.appendChild(div);
			});
			if (page > 1) {
				chatDiv.prepend(fragment);
				chatDiv.scrollTop = chatDiv.scrollHeight - prevScrollHeight;
			} else {
				chatDiv.appendChild(fragment);
				chatDiv.scrollTop = chatDiv.scrollHeight;
			}
			actual_chat_id = chat_id;
			setupInfiniteScroll();
			return chatHistoryTyped.length === 20;
		} catch (error) {
			console.error(error);
			return false;
		}
	}
	return false;
}

let currentPage = 1;
let hasMoreMessages = true;

export async function setupInfiniteScroll() {
	const chatDiv = document.getElementById("message-history");
	if (!chatDiv) return;
	if (hasMoreMessages) {
		chatDiv.addEventListener("scroll", () => {
			if (chatDiv.scrollTop < 100 && chatDiv.scrollHeight > chatDiv.clientHeight) {
				handleScroll();
			}
		});
	}
}

async function handleScroll() {
	const chatDiv = document.getElementById("message-history");
	if (!chatDiv || !hasMoreMessages) return;
	if (chatDiv.scrollTop < 50) {
		currentPage++;
		hasMoreMessages = await chargeChat(
			actual_chat_id,
			document.getElementById("chat-friend-username")?.innerText || "",
			document.getElementById("contact-picture")?.getAttribute("src") || "",
			currentPage,
		);
	}
}

export async function getChatInfo(chat_id: number): Promise<ChatInfo | null> {
	if (!chat_id)
		return null;
	try {
		const chat_info = await sendRequest('GET', `/chats/identify/${chat_id}`);
		if (!chat_info)
			throw new Error("Error fetching chat information");
		return chat_info;
	}
	catch (error) {
		console.error(error);
		return null;
	}
}
