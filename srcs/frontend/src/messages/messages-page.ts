import { getChatInfo ,actual_chat_id, recentChats, loadInfo } from "./load-info.js"
import { navigateTo } from "../index.js";
import { Message, MessageObject, ChatInfo } from "../types.js";

let socket: WebSocket | null = null;

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
    if (socket)
      socket.close()
		navigateTo("/home");
	});
}

function getClientID(): number {
  let chats = localStorage.getItem("id");
  if (!chats)
    return -1;
  return parseInt(chats);
}

function createSocketConnection() {
  if (socket && socket.readyState !== WebSocket.CLOSED){
    socket.close();
  }
  try{
    socket = new WebSocket(`wss://${window.location.hostname}:8443/ws/chat`)
    if (!socket)
      return ;
    socket.onopen = () => {
      let id = getClientID();
      console.log("WebSocket connection established, sending id:", id);
      if (id === -1){
        console.error("Invalid ID, cannot connect to back")
      }
      else{
        if (!socket)
          return ;
        socket.send(JSON.stringify({
          userId: id,
          action: "identify"
        }));
        console.log("ID succesfully sent");
      }
    };
    socket.onmessage = (event) => {
      try{
        const data = JSON.parse(event.data);
        if (data.sender_id && data.body) {
          displayMessage(data);
        }
      }
      catch(err) {
        console.error("Error on message", err);
      }
    };
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null;
    };
  }
  catch(err){
    console.error("Error creating WebSocket:", err);
  }
}

function displayMessage(data: Message){
    console.log(actual_chat_id);
    let messageContainer = document.getElementById("message-history");
    if (!messageContainer)
      return ;
    let el = document.createElement("div");
    const sent_at = data.sent_at.substring(11, 16);
    if (data.sender_id === getClientID()){
      el.setAttribute("id", "message");
      el.innerHTML = `
        <div class="message self-message">
          <p>${data.body}</p>
          <p class="hour">${sent_at}</p>
        </div>`;
    }
    else if (data.receiver_id === getClientID() && actual_chat_id === data.chat_id){
      el.setAttribute("id", "friend-message");
      el.innerHTML = `
      <div class="message friend-message">
        <p>${data.body}</p>
        <p class="hour">${sent_at}</p>
      </div>`;
    }
    messageContainer.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth'});
    recentChats();
}

async function setupMessageForm() {
  const messageForm = document.getElementById("message-box") as HTMLFormElement;
  if (!messageForm)
    return;
  messageForm.addEventListener("submit", async function(event){
    event.preventDefault();
    const input = messageForm.querySelector("input") as HTMLInputElement;
    if (!input)
      return;
    const message = input.value.trim();
    const chatInfo = await getChatInfo(actual_chat_id);
    if (!chatInfo)
      return ;
    const friendID = chatInfo.friend_id;
    if (message && socket){
      const date = new Date();
      date.setHours(date.getHours() + 2);
      let fullMessage: Message = {
        body: message,
        chat_id: actual_chat_id,
	      receiver_id: friendID,
	      sender_id: getClientID(),
        sent_at: date.toISOString(),
        read: false,
      }
      socket.send(JSON.stringify(fullMessage));
      displayMessage(fullMessage);
    }
    input.value = "";
  });
}

export { getClientID };
export { socket };
