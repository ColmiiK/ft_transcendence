import { getChatInfo, actual_chat_id, recentChats, loadInfo } from "./load-info.js"
import { navigateTo } from "../index.js";
import { Message, MessageObject, Tournament } from "../types.js";
import { sendRequest } from "../login-page/login-fetch.js";
import { showAlert } from "../toast-alert/toast-alert.js";
//import { createSocketTournamentConnection } from "../tournament/tournament.js";
//let activeTournament: Tournament | null = null;

export let socketChat: WebSocket | null = null;

export function initMessagesEvents(data: MessageObject) {
  moveToHome();
  loadInfo(data);
  createSocketConnection();
  setupMessageForm();
}

export function moveToHome() {
  const homeButton = document.getElementById("home-button");
  if (!homeButton)
    return;
  homeButton.addEventListener("click", () => {
    if (socketChat)
      socketChat.close()
    navigateTo("/home");
  });
}

export function getClientID(): number {
  let chats = localStorage.getItem("id");
  if (!chats)
    return -1;
  return parseInt(chats);
}

function createSocketConnection() {
  if (socketChat && socketChat.readyState !== WebSocket.CLOSED)
    socketChat.close();
  try {
    socketChat = new WebSocket(`wss://${window.location.hostname}:8443/ws/chat`)
    if (!socketChat)
      return;
    socketChat.onopen = () => {
      let id = getClientID();
      if (id === -1)
        console.error("Invalid ID, cannot connect to back")
      else {
        if (!socketChat)
          return;
        socketChat.send(JSON.stringify({
          userId: id,
          action: "identify"
        }));
      }
    };
    socketChat.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sender_id && data.body)
          displayMessage(data);
      }
      catch (err) {
        console.error("Error on message", err);
      }
    };
    socketChat.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    socketChat.onclose = () => {
      socketChat = null;
    };
  }
  catch (err) {
    console.error("Error creating WebSocketChat:", err);
  }
}

export function displayMessage(data: Message) {
  if (actual_chat_id !== data.chat_id && data.type === "message")
    showAlert(`You have a message from ${data.sender_username}`, "toast-success");
  else if (actual_chat_id !== data.chat_id && data.type === "tournament")
    showAlert(`You have a tournament inivitation from ${data.sender_username}`, "toast-success");
  if (data.type === "message") {
    let messageContainer = document.getElementById("message-history");
    if (!messageContainer)
      return;
    let el = document.createElement("div");
    const sent_at = data.sent_at.substring(11, 16);
    if (data.sender_id === getClientID()) {
      el.setAttribute("id", "message");
      el.innerHTML = `
          <div class="message self-message">
            <p>${data.body}</p>
            <p class="hour">${sent_at}</p>
          </div>`;
    }
    else if (data.receiver_id === getClientID() && actual_chat_id === data.chat_id) {
      el.setAttribute("id", "friend-message");
      el.innerHTML = `
        <div class="message friend-message">
          <p>${data.body}</p>
          <p class="hour">${sent_at}</p>
        </div>`;
      sendRequest(`PATCH`, `messages/${data.message_id}`, { is_read: 1 });
    }
    messageContainer.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth' });
    recentChats();
  }
  /*else if (data.type === "tournament" && data.tournament) {
    let messageContainer = document.getElementById("message-history");
    if (!messageContainer) return;

    let el = document.createElement("div");
    const sent_at = data.sent_at.substring(11, 16);
    const body = `Play in ${data.tournament.game_type} tournament`
    if (data.info === "request") {
      el.setAttribute("id", "tournament-invite");
      el.innerHTML = `
                <div class="message tournament-message">
                    <p>${body}</p>
                    <p class="hour">${sent_at}</p>
                    <div class="tournament-actions">
                        <button class="accept-btn" data-tournament-id="${data.tournament.tournament_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            Accept
                        </button>
                        <button class="reject-btn" data-tournament-id="${data.tournament.tournament_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Reject
                        </button>
                    </div>
                </div>`;

      // Add event listeners for the buttons
      const acceptBtn = el.querySelector('.accept-btn');
      const rejectBtn = el.querySelector('.reject-btn');

      acceptBtn?.addEventListener('click', () => {
        if (socketChat && data.tournament) {
          socketChat.send(JSON.stringify({
            body: "Tournament accepted",
            type: "tournament",
            info: "accept",
            tournament: data.tournament,
            sender_id: getClientID(),
            receiver_id: data.sender_id
          }));
          acceptBtn.setAttribute('disabled', 'true');
          acceptBtn.classList.add('disabled');
          rejectBtn?.remove();
          acceptBtn.textContent = "Accepted ✓";
        }
      });

      rejectBtn?.addEventListener('click', () => {
        if (socketChat && data.tournament) {
          socketChat.send(JSON.stringify({
            body: "Tournament rejected",
            type: "tournament",
            info: "reject",
            tournament: data.tournament,
            sender_id: getClientID(),
            receiver_id: data.sender_id
          }));
          rejectBtn.setAttribute('disabled', 'true');
          rejectBtn.classList.add('disabled');
          acceptBtn?.remove();
          rejectBtn.textContent = "Rejected ✗";
        }
      });
    }
    messageContainer.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth' });
  }*/
  else if (data.type === "game") {
    let messageContainer = document.getElementById("message-history");
    if (!messageContainer) return;
    let el = document.createElement("div");
    const sent_at = data.sent_at.substring(11, 16);
    if (data.info === "request") {
      if (data.sender_id === getClientID()) {
        const game_type = data.body.substring(27);
        el.setAttribute("id", "message");
        el.innerHTML = `
                <div class="message self-message">
                    <p>I want to play with you to ${game_type}</p>
                    <p class="hour">${sent_at}</p>
                </div>`;
      }
      else if (data.receiver_id === getClientID()) {
        el.setAttribute("id", "friend-message");
        el.innerHTML = `
                 <div class="message friend-message flex flex-col">
                    <p>${data.body}</p>
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

        const acceptBtn = el.querySelector('.accept-btn') as HTMLButtonElement;
        const rejectBtn = el.querySelector('.reject-btn') as HTMLButtonElement;
        acceptBtn?.addEventListener('click', (event) => {
          const date = new Date();
          date.setHours(date.getHours() + 2);
          event.preventDefault();
          if (socketChat) {
            socketChat.send(JSON.stringify({
              type: "game",
              info: "accept",
              game_type: data.game_type,
              sender_id: getClientID(),
              receiver_id: data.sender_id,
              body: "Game invitation accepted",
              chat_id: actual_chat_id,
              sent_at: date.toISOString(),
            }));
            acceptBtn.disabled = true;
            acceptBtn.textContent = "Accepted ✓";
            rejectBtn?.remove();
            acceptBtn.classList.add('bg-gray-500');
            sendRequest(`PATCH`, `messages/${data.message_id}`, { invitation_status: "accept" });
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
              game_type: data.game_type,
              sender_id: getClientID(),
              receiver_id: data.sender_id,
              body: "Game invitation rejected",
              chat_id: actual_chat_id,
              sent_at: date.toISOString(),
            }));
            rejectBtn.disabled = true;
            rejectBtn.textContent = "Rejected ✗";
            acceptBtn?.remove();
            rejectBtn.classList.add('bg-gray-500');
            sendRequest(`PATCH`, `messages/${data.message_id}`, { invitation_status: "reject" });
          }
        });
      }
      messageContainer.appendChild(el);
    }
    else if (data.info === "accept") {
      if (data.sender_id === getClientID() && actual_chat_id === data.chat_id) {
        el.setAttribute("id", "message");
        el.innerHTML = `
        <div class="message self-message">
          <p>${data.body}</p>
          <p class="hour">${sent_at}</p>
        </div>`;
        sendRequest(`PATCH`, `messages/${data.message_id}`, { is_read: 1 });
        messageContainer.appendChild(el);
      }
      else if (data.receiver_id === getClientID() && actual_chat_id === data.chat_id) {
        el.setAttribute("id", "friend-message");
        el.innerHTML = `
        <div class="message friend-message">
          <p>${data.body}</p>
          <p class="hour">${sent_at}</p>
        </div>`;
        sendRequest(`PATCH`, `messages/${data.message_id}`, { is_read: 1 });
        messageContainer.appendChild(el);
      }
    }
    else if (data.info === "reject") {
      if (data.sender_id === getClientID() && actual_chat_id === data.chat_id) {
        el.setAttribute("id", "message");
        el.innerHTML = `
        <div class="message self-message">
          <p>${data.body}</p>
          <p class="hour">${sent_at}</p>
        </div>`;
        sendRequest(`PATCH`, `messages/${data.message_id}`, { is_read: 1 });
        messageContainer.appendChild(el);
      }
      else if (data.receiver_id === getClientID() && actual_chat_id === data.chat_id) {
        el.setAttribute("id", "friend-message");
        el.innerHTML = `
        <div class="message friend-message">
          <p>${data.body}</p>
          <p class="hour">${sent_at}</p>
        </div>`;
        sendRequest(`PATCH`, `messages/${data.message_id}`, { is_read: 1 });
        messageContainer.appendChild(el);
      }
    }
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

async function setupMessageForm() {
  const messageForm = document.getElementById("message-box") as HTMLFormElement;
  if (!messageForm)
    return;
  messageForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const input = messageForm.querySelector("input") as HTMLInputElement;
    if (!input)
      return;
    const message = input.value.trim();
    const chatInfo = await getChatInfo(actual_chat_id);
    if (!chatInfo)
      return;
    const friendID = chatInfo.friend_id;
    if (message && socketChat) {
      const date = new Date();
      date.setHours(date.getHours() + 2);
      /*if (message.startsWith('/tournament')) {
        const args = message.slice('/tournament'.length).trim().split('-game');
        const tournament_name = args[0].trim();
        const game_type = args[1]?.trim().toLowerCase();
        if (activeTournament) {
          showAlert("You're already in a tournament. Finish or cancel it first.", "toast-error");
          input.value = "";
          return;
        }
        if (!tournament_name) {
          showAlert("Please provide a tournament name: /tournament {name} -game {type}", "toast-error");
          input.value = "";
          return;
        }
        if (!game_type || (game_type !== "pong" && game_type !== "4inrow")) {
          showAlert("Please specify a valid game type (pong or 4inrow): /tournament {name} -game {type}", "toast-error");
          input.value = "";
          return;
        }
        let tournament = await createSocketTournamentConnection(tournament_name, game_type);
        activeTournament = tournament
        let fullMessage: Message = {
          body: message,
          chat_id: actual_chat_id,
          receiver_id: friendID,
          sender_id: getClientID(),
          sent_at: date.toISOString(),
          read: false,
          type: "tournament",
          info: "request",
          tournament: tournament,
        };
        socketChat.send(JSON.stringify(fullMessage));
      }
      if (message.startsWith("/invite")) {
        if (activeTournament) {
          let fullMessage: Message = {
            body: message,
            chat_id: actual_chat_id,
            receiver_id: friendID,
            sender_id: getClientID(),
            sent_at: date.toISOString(),
            read: false,
            type: "tournament",
            info: "request",
            tournament: activeTournament,
          };
          socketChat.send(JSON.stringify(fullMessage));
        }
        else if (!activeTournament)
          showAlert("Can't invite before creating a tournament", "toast-error")
      }*/
      let fullMessage: Message = {
        body: message,
        chat_id: actual_chat_id,
        receiver_id: friendID,
        sender_id: getClientID(),
        sent_at: date.toISOString(),
        read: false,
        type: "message",
      }
      socketChat.send(JSON.stringify(fullMessage));
      displayMessage(fullMessage);
    }
    input.value = "";
  });
}
