import { sendRequest } from "../login-page/login-fetch.js";
import { LastMessage, Message, MessageObject, ChatInfo } from "../types.js"
export let actual_chat_id: number;

export function loadInfo(data: MessageObject) {
	displayFirstChat(data);
	recentChats();
	searchChatFriend();

	const returnButton = document.getElementById("go-back-chat");
	if (returnButton)
		returnButton.addEventListener("click", () => {
			toggleMobileDisplay();
	});
	window.addEventListener("resize", changedWindowSize);
}

function searchChatFriend() {
	const searchFriend = document.getElementById("search-friend-chat");
	if (searchFriend) {
		searchFriend.addEventListener("submit", (e) => {
			e.preventDefault();
			const input = searchFriend.querySelector("input") as HTMLInputElement;
			if (!input)
			return;

			// Here goes the functionality of searching a friend
			input.value = "";
		});
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
		return ;

	// Opens the most recent chat when navigated to messages page
	try {
		const recentChats = await sendRequest('GET', 'chats/last');
		if (!recentChats)
			throw new Error("Error displaying the first chat");

		const recentChatsTyped = recentChats as LastMessage[];
		if (recentChatsTyped) {
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

export async function recentChats() {
	let last_chat = 0;
	const recentChatsDiv = document.getElementById("conversation-list");

	if (recentChatsDiv) {
		try {
			const searchForm = document.getElementById("search-friend-chat");
			const chatEntries = recentChatsDiv.querySelectorAll("div:not(#search-friend-chat)");
			chatEntries.forEach(entry => {
			  if (entry !== searchForm)
				entry.remove();
			});
			const recentChatsTyped = await sendRequest('GET', 'chats/last') as LastMessage[];
			if (!recentChatsTyped)
				throw new Error("Error fetching recent chats");
	
			recentChatsTyped.forEach((chat) => {
				var subDiv = document.createElement('div');
	
				let truncated = "";
				chat.body?.length > 10 ? truncated = chat.body.substring(0, 10) + "..." : truncated = chat.body;
				subDiv.innerHTML = `
				<div id="chat-${chat.chat_id} "class="flex items-center gap-2 recent-chat-card">
					<div id="chat-avatar">
						<img class="rounded-full aspect-square" src="${chat.friend_avatar}" alt="Avatar">
					</div>
					<div class="chat-info overflow-hidden">
						<h3>${chat.friend_username}</h3>
						<p class="opacity-50 text-sm">${truncated}</p>
					</div>
				</div>
				`;
				recentChatsDiv.appendChild(subDiv);
				subDiv.addEventListener("click", () => {
					if (last_chat !== chat.chat_id) {
						last_chat = chat.chat_id;
						chargeChat(chat.chat_id, chat.friend_username, chat.friend_avatar);
					}
				});
			})
		}
		catch (error) {
			console.error(error);
		}
	}
}

// FIX: sometimes it still mixes messages up
export async function chargeChat(chat_id: number, friend_username: string, friend_avatar: string, page: number = 1) {
  if (window.innerWidth < 768 && page === 1)
    toggleMobileDisplay();

  // Check if the chat changed from previous one
  if (actual_chat_id !== chat_id && chat_id !== 0) {
    // console.log(`Switching chats from ${actual_chat_id} to ${chat_id}. Resetting pagination.`);

    currentPage = 1;
    hasMoreMessages = true;
    page = 1;
  }

  const chatDiv = document.getElementById("message-history");
  let contactName = document.getElementById("chat-friend-username");
  let contactAvatar = document.getElementById("contact-picture");

  if (contactName) contactName.innerText = friend_username;
  if (contactAvatar) contactAvatar.setAttribute("src", friend_avatar);

  await getChatInfo(chat_id);
  if (chatDiv) {
    try {
      const chatHistoryTyped = await sendRequest("GET", `chats/${chat_id}?page=${page}`) as Message[];
      // Delete if it's a new page
      if (page === 1 && chatDiv.children.length > 0)
        chatDiv.innerHTML = "";

      // console.log('chat_id:', chat_id, "page:", page)

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
        fragment.appendChild(div);
      });
      if (page > 1) {
        // Put the messages on top
        chatDiv.prepend(fragment);
        chatDiv.scrollTop = chatDiv.scrollHeight - prevScrollHeight;
      } else {
        // Put the messages below
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

// Set up the scroll event listener
export function setupInfiniteScroll() {
  const chatDiv = document.getElementById("message-history");
  if (!chatDiv) return;
  if (hasMoreMessages) {
    chatDiv.addEventListener("scroll", handleScroll);
    // console.log("Infinite scroll enabled");
    // Check if the div has scrolled almost all the way to load the next batch
    if (
      chatDiv.scrollTop < 100 &&
      chatDiv.scrollHeight > chatDiv.clientHeight
    ) {
      setTimeout(() => {
        handleScroll();
      }, 500);
    }
  }
}

// Function to handle scroll events
async function handleScroll() {
  const chatDiv = document.getElementById("message-history");
  if (!chatDiv || !hasMoreMessages) return;
  // Check if user has scrolled to the top (with a small threshold)
  if (chatDiv.scrollTop < 50) {
    // Advance to the next page
    currentPage++;
    // Fetch the batch
    hasMoreMessages = await chargeChat(
      actual_chat_id,
      document.getElementById("chat-friend-username")?.innerText || "",
      document.getElementById("contact-picture")?.getAttribute("src") || "",
      currentPage,
    );
  }
}

export async function getChatInfo(chat_id: number) : Promise<ChatInfo | null>  {
	try {
		const chat_info = await sendRequest('GET', `/chats/identify/${chat_id}`);
		if (!chat_info)
			throw new Error("Error fetching chat information");
		return chat_info;
	}
	catch(error) {
		console.error(error);
		return null;
	}
}
