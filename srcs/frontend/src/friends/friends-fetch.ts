import { UserMatches } from "../types.js"
import { FriendList } from "../types.js"
import { sendRequest } from "../login-page/login-fetch.js";
import { displayBlockPopUp, closeModal } from "./friends-page.js"

export function initFriendFetches() {
	const searchForm = document.getElementById("message-box") as HTMLFormElement;
	const friendInput = document.getElementById("friend-input") as HTMLInputElement;
	const searchFriend = document.getElementById("search-friend") as any;
	if (!friendInput || !searchFriend || !searchForm)
		return;
	displayFriends();

	const friendHolder = document.getElementById("friends-holder");
	if (friendHolder) {
		friendHolder.addEventListener("click", (e) => { clickFriendProfile(e) });
	}

	document.addEventListener("click", (event) => {
		const target = event.target as Node;
		// If click is outside the search form
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
	friendInput.oninput = debounce(() => {showMatches(friendInput.value)}, 500);
}

async function clickFriendProfile(e: Event) {
    const target = e.target as HTMLElement;
    const friendElement = target.closest('[id^="friend-id-"]') as HTMLElement;
    
    if (friendElement) {
		console.log("friendElementId: ", friendElement.id);
        const friendId = friendElement.id.replace("friend-id-", "");
		console.log("friendId: ", friendId );
        try {
            const friendProfileTyped = await sendRequest('GET', `/users/friends/${friendId}`) as FriendList;
            if (!friendProfileTyped)
                throw new Error("Error while fetching friend profile");
            
            const friendProfileDiv = document.getElementById("friend-profile");
            if (!friendProfileDiv)
                return;
            
            friendProfileDiv.innerHTML = ` 
					<div id="friend-data" class="flex justify-between items-center gap-4 w-full">
						<div class="flex flex-col ml-4">
							<p class="font-bold">Username: <span id="friend-name" class="font-thin">${friendProfileTyped.username}</span></p>
							<p class="font-bold">Nick: <span id="friend-nick" class="font-thin">${friendProfileTyped.alias}</span></p>
							<div id="friend-status" class="flex gap-2">
								${friendProfileTyped.is_online === 1 ?
								'<p>Online</p><img src="../../resources/img/online.svg" alt="Online status">' :
								'<p>Offline</p><img src="../../resources/img/offline.svg" alt="Offline status">'
								}
							</div>
							<p class="font-bold">Description: <span id="friend-description" class="italic font-thin">${friendProfileTyped.status}</span></p>
							<div class="flex justify-center gap-10 my-4">
								<button id="delete-friend" class="button">Delete</button>
								<button id="block-friend" class="button">Block</button>
							</div>
						</div>
						<div class="flex flex-col items-center mr-4">
							<img id="friend-profile-photo" class="rounded-full" src="../../resources/img/cat.jpg" alt="Profile photo">
						</div>
					</div>
					<div id="friend-statistics" class="flex flex-col items-center">
						<p class="font-bold text-center">Pong Games Played: <span class="font-thin">${friendProfileTyped.pong_games_played}</span></p>
						<p class="font-bold text-center">Pong Wins Rate: <span class="font-thin">${friendProfileTyped.pong_games_won}</span></p>
						<p class="font-bold text-center">Pong Loses Rate: <span class="font-thin">${friendProfileTyped.pong_games_lost}</span></p>
						<p class="font-bold text-center">Connect Four Games Played: <span class="font-thin">${friendProfileTyped.connect_four_games_played}</span></p>
						<p class="font-bold text-center">Connect Four Wins Rate: <span class="font-thin">${friendProfileTyped.connect_four_games_played}</span></p>
						<p class="font-bold text-center">Connect Four Loses Rate: <span class="font-thin">${friendProfileTyped.connect_four_games_played}</span></p>
					</div>
					`

			friendProfileDiv.style.display = 'flex';
			const blockFriendButton = document.getElementById("block-friend");
			if (blockFriendButton)
				blockFriendButton.addEventListener("click", () => { displayBlockPopUp(friendId) });
        }
        catch (error) {
            console.error(error);
        }
    }
}

function emptyMatches(datalist: HTMLElement) {
	var prevOptions = datalist.querySelectorAll(".match-option");
	if (prevOptions) {
		prevOptions.forEach((option) => {
			option.remove();
		})
	}
}

async function showMatches(input: string) {
	const datalist = document.getElementById("search-friend");

	if (datalist) {
		emptyMatches(datalist);
		if (!input || input.length === 0)
			return ;
	
		const matchesTyped = await sendRequest('POST', '/users/search', {username: input}) as UserMatches[];
		for(let i = 0, j = 0; (i < matchesTyped.length && i < 5) || j === 0; i++, j++) {
			var option;
			if (matchesTyped.length === 0) {
				option = document.createElement('p');
				option.innerText = "User Not Found";
			}
			else {
				option = document.createElement('option');
				if (matchesTyped[i].is_friend === 0) {
					option.innerHTML = `
					${matchesTyped[i].username}
					<svg id="accept-invitation" class="add-remove-icon add" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
						<path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z"/>
					</svg>
					`;
				}
				else if (matchesTyped[i].is_friend === 1) {
					option.innerHTML = `
					${matchesTyped[i].username}
					<svg xmlns="http://www.w3.org/2000/svg" id="friend-chat" class="add-remove-icon message-icon" viewBox="0 -960 960 960">
						<path d="M880-80 720-240H320q-33 0-56.5-23.5T240-320v-40h440q33 0 56.5-23.5T760-440v-280h40q33 0 56.5 23.5T880-640v560ZM160-473l47-47h393v-280H160v327ZM80-280v-520q0-33 23.5-56.5T160-880h440q33 0 56.5 23.5T680-800v280q0 33-23.5 56.5T600-440H240L80-280Zm80-240v-280 280Z"/>
					</svg>
					`
				}
				else {
					option.innerHTML = `
					${matchesTyped[i].username}
					<svg xmlns="http://www.w3.org/2000/svg" class="pending" viewBox="0 -960 960 960">
						<path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/>
					</svg>
					`
				}
				
			}
			option.setAttribute("class", "match-option");
			datalist.appendChild(option);
		}

		// Here comes the navigation to the friend chat
		// const messageButton = document.getElementById("friend-chat");
		// if (messageButton)
		// 	messageButton.addEventListener("click", () => { goFriendChat() });
	}
}

function debounce(callback: Function, wait: number) {
	let timerId: number | NodeJS.Timeout;;
	return (...args: Object[]) => {
	  clearTimeout(timerId);
	  timerId = setTimeout(() => {
		callback(...args);
	  }, wait);
	};
}

async function displayFriends() {
	try {
		const friendListPage = document.getElementById("friends-holder");
		const friendListTyped = await sendRequest('GET', 'users/friends') as FriendList[];
		if (!friendListTyped || !friendListPage)
			throw new Error("Error during display friends");

		if (friendListPage.children.length > 0)
			friendListPage.innerHTML = "";

		friendListTyped.forEach((friend) => {
			const section = document.createElement("section");
			section.setAttribute("id", `friend-id-${friend.user_id}`);
			section.setAttribute("class", "friend-class");
			section.setAttribute("class", "friend-card");
			section.innerHTML = `
						<div class="flex items-center gap-4">
							<img id="friend-avatar" class="card-avatar rounded-full" src="../../resources/img/cat.jpg" alt="Avatar">
							<div class="flex flex-col">
								<h3>${friend.username}</h3>
								<p class="opacity-50 text-sm">${friend.status}</p>
							</div>
						</div>
						<div id="friend-status" class="flex gap-2 px-4">
							${friend.is_online === 1 ?
								'<p>Online</p><img src="../../resources/img/online.svg" alt="Online status">' :
								'<p>Offline</p><img src="../../resources/img/offline.svg" alt="Offline status">'
							}
						</div>
					`;
			friendListPage.appendChild(section);
		});
	}
	catch(error) {
		console.error(error);
	}

}

export async function blockFriend(friendId: string) {
	try {
		console.log("friendId: ", friendId);
		const response = await sendRequest('POST', '/users/blocks', {blocked_id: friendId});
		if (!response)
			throw new Error("Error during block friend fetch");

		const modal = document.getElementById("block-user") as HTMLDialogElement;
		const friendProfile = document.getElementById("friend-profile");
		if (modal && friendProfile) {
			closeModal(modal);
			friendProfile.style.display = 'none';
		}

		displayFriends();
	}
	catch (error) {
		console.error(error);
	}
}
