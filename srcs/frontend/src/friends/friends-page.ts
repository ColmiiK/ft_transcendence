import { moveToHome } from "../messages/messages-page.js"
import { User } from "../types.js";
import { initFriendFetches, displayFriends, displayInvitations, blockFriend, clickFriendProfile } from "./friends-fetch.js"

export function initFriendsEvents(data: User | null) {
	moveToHome();
	changeFriendPage();
	initFriendFetches();

	const returnButton = document.getElementById("go-back");
	if (returnButton)
		returnButton.addEventListener("click", () => {
			toggleMobileDisplay();
	});
	window.addEventListener("resize", changedWindowSize);
	if (data && data.user_id) {
		clickFriendProfile(null, data);
	}
}

function changedWindowSize() {
	const friendsHolder = document.getElementById("friends-holder");
	const friendProfile = document.getElementById("friend-profile");
	const returnButton = document.getElementById("go-back");

	if (friendsHolder && friendProfile && returnButton) {
		if (window.innerWidth > 768) {
			friendsHolder.style.display = 'flex';
			returnButton.style.display = 'none';
		}
		else {
			if (friendsHolder.style.display === 'flex') {
				friendProfile.style.display = 'none';
				returnButton.style.display = 'none';
			}
			else {
				friendsHolder.style.display = 'none';
				friendProfile.style.display = 'flex';
				returnButton.style.display = 'flex';
			}
		  }
	}
}

export function toggleMobileDisplay() {
	const friendsHolder = document.getElementById("friends-holder");
	const friendProfile = document.getElementById("friend-profile");
	const returnButton = document.getElementById("go-back");
	
	if (friendsHolder && friendProfile && returnButton) {
		if (friendsHolder.style.display !== 'none') {
			friendsHolder.style.display = 'none';
			friendProfile.style.display = 'flex';
			returnButton.style.display = 'flex';
		}
		else {
			returnButton.style.display = 'none';
			friendProfile.style.display = 'none';
			friendsHolder.style.display = 'flex';
			displayFriends();
		}
	}
}

function changeFriendPage() {
	const friendListButton = document.getElementById("friend-list-page");
	const invitationListButton = document.getElementById("friend-invitation-page");
	const friendListPage = document.getElementById("friend-list");
	const invitationListPage = document.getElementById("invitation-list");
	if (!friendListButton || !invitationListButton || !friendListPage || !invitationListPage)
		return ;
	
	invitationListButton.addEventListener("click", () => {
		if (friendListPage.style.display !== 'none') {
			friendListPage.style.display = 'none';
			invitationListPage.classList.add('flex');
			invitationListPage.classList.remove('hidden');
			const friendProfile = document.getElementById("friend-profile");
			const returnButton = document.getElementById("go-back");
			if (friendProfile && returnButton) {
				friendProfile.style.display = 'none';
				returnButton.style.display = 'none';
			}
			displayInvitations();
		}
	});
	friendListButton.addEventListener("click", () => {
		if (friendListPage.style.display !== 'flex') {
			friendListPage.style.display = 'flex';
			invitationListPage.classList.remove('flex');
			invitationListPage.classList.add('hidden');
			const friendsHolder = document.getElementById("friends-holder");
			if (window.innerWidth < 768 && friendsHolder && friendsHolder.style.display === 'none')
				toggleMobileDisplay();
			displayFriends();
		}
	});
}

export function displayBlockPopUp(friendId: string) {
	const blockUser = document.getElementById("block-user") as HTMLDialogElement;
	const closeButton = document.getElementsByClassName("close-icon")[0] as HTMLButtonElement;
	const cancelButton = document.getElementsByClassName("cancel-button")[0] as HTMLButtonElement;
	const blockButton = document.getElementsByClassName("block-button")[0] as HTMLButtonElement;
	if (!blockUser || !closeButton || !cancelButton || !blockButton)
		return;
	blockUser.style.display = "flex";
	blockUser.showModal();

	closeButton.onclick = () => { closeModal(blockUser) };
    cancelButton.onclick = () => { closeModal(blockUser) };
    blockButton.onclick = () => { blockFriend(friendId) };
}


 
export function closeModal(modal: HTMLDialogElement) {
	modal.style.display = "none";
	modal.close();
}