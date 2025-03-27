import { sendRequest } from "../login-page/login-fetch.js";
import { LastMessage } from "../types.js"
import { Chat } from "../types.js"
import { Message } from "../types.js";

export function loadInfo() {
	recentChats();
}

async function recentChats() {
	let last_chat = 0;
	const recentChatsDiv = document.getElementById("conversation-list");

	if (recentChatsDiv) {
		const recentChats = await sendRequest('GET', 'chats/last');
		const recentChatsTyped = recentChats as LastMessage[];

		recentChatsTyped.forEach((chat, index) => {
			var subDiv = document.createElement('div');

			let truncated = "";
			if (chat.body)
				chat.body.length > 15 ? truncated = chat.body.substring(0, 15) + "..." : truncated = chat.body;

			subDiv.innerHTML = `
			<div id="chat-${chat.chat_id} "class="flex items-center gap-2 recent-chat-card">
				<div id="chat-avatar">
					<img class="rounded-full" src="../../resources/img/cat.jpg" alt="Avatar">
				</div>
				<div class="chat-info">
					<h3>${chat.sender_username}</h3>
					<p class="opacity-50 text-sm">${truncated}</p>
				</div>
			</div>
			`;

			// Opens the most recent chat when navigated to messages page
			if (index == 0)
				chargeChat(chat.chat_id, chat.sender_username);

			recentChatsDiv.appendChild(subDiv);
			subDiv.addEventListener("click", () => {
				if (last_chat !== chat.chat_id) {
					last_chat = chat.chat_id;
					chargeChat(chat.chat_id, chat.sender_username);
				}
			});
		})
	}
}

async function chargeChat(chat_id: number) {
	const chatDiv = document.getElementById("message-history");

	if (chatDiv) {
		if (chatDiv.children.length > 0)
			chatDiv.innerHTML = '';
		let contactName = document.getElementById("contact-name");
					if (contactName)
						contactName.innerText = chat.sender_username;
		const chatHistory = await sendRequest('GET', `chats/${chat_id}`);
		const chatHistoryTyped = chatHistory as Message[];
		chatHistoryTyped.forEach((message) => {
			let div = document.createElement("div");
			
			const username = localStorage.getItem("username");
			// let contactName = document.getElementById("contact-name");
			if (username) {
				if (message.sender_username !== username) {
					div.setAttribute("id", "friend-message");
					div.innerHTML = `<div class="message friend-message">${message.body}</div>`;
					// contactName.innerText = message.sender_username;
				}
				else {
					div.setAttribute("id", "message");
					div.innerHTML = `<div class="message self-message">${message.body}</div>`;
					// contactName.innerText = message.receiver_username
				}
			}
			div.scrollIntoView({ behavior: 'smooth' });
			chatDiv.appendChild(div);
		});
	}
}