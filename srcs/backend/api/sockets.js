import { getChatBetweenUsers } from "./models/chatModel.js";
import { scheduleMatch } from "./models/matchModel.js";
import { createMessage } from "./models/messageModel.js";
import { getUsername, isBlocked, patchUser } from "./models/userModel.js";
import { asyncWebSocketHandler } from "./utils.js";

const socketsChat = new Map();
const socketsToast = new Map();

async function messageInChat(data, userId) {
	let username = await getUsername(data.sender_id);
	let receiver_username = await getUsername(data.receiver_id);
	if (await isBlocked(data.sender_id, data.receiver_id) === false && await isBlocked(data.receiver_id, data.sender_id) === false && receiver_username !== "anonymous") {
		if (data.receiver_id && data.body) {
			const receiver_id = parseInt(data.receiver_id);
			const sender_id = parseInt(data.sender_id);
			const chat_id = await getChatBetweenUsers(data.sender_id, data.receiver_id);
			const toastReceiver = socketsToast.get(receiver_id);
			const toastSender = socketsToast.get(sender_id);
			if (data.type === "message") {
				const message = await createMessage({
					body: data.body,
					sender_id: data.sender_id,
					receiver_id: data.receiver_id,
					chat_id: chat_id,
					sent_at: data.sent_at,
					is_read: 0
				})
				if (socketsChat.has(receiver_id)) {
					const message_id = message.id;
					const receiver = socketsChat.get(receiver_id);
					receiver.send(JSON.stringify({
						body: data.body,
						message_id: message_id,
						chat_id: chat_id,
						receiver_id: receiver_id,
						sender_id: userId,
						sender_username: username,
						sent_at: data.sent_at,
						read: false,
						type: "message",
					}))
				}
				else if (!socketsChat.has(receiver_id) && socketsToast.has(receiver_id))
					toastReceiver.send(JSON.stringify({ type: "chatToast", body: `You have a message from ${username}` }))
			}
			else if (data.type === "game") {
				const receiver_id = parseInt(data.receiver_id);
				if (data.info === "request") {
					const invitation = await createMessage({
						body: data.body,
						sender_id: data.sender_id,
						receiver_id: data.receiver_id,
						chat_id: data.chat_id,
						sent_at: data.sent_at,
						is_read: 0,
						invitation_type: "game",
						invitation_status: "pending",
						game_type: data.game_type,
					})
					const message_id = invitation.id;
					if (socketsChat.has(receiver_id)) {
						const receiver = socketsChat.get(receiver_id);
						receiver.send(JSON.stringify({
							body: data.body,
							message_id: message_id,
							chat_id: data.chat_id,
							receiver_id: data.receiver_id,
							sender_id: userId,
							sender_username: username,
							sent_at: data.sent_at,
							read: false,
							type: "game",
							info: "request",
							game_type: data.game_type
						}))
					}
					else if (socketsToast.has(receiver_id)) {
						if (socketsToast.has(receiver_id)) {
							const receiver = socketsToast.get(receiver_id);
							receiver.send(JSON.stringify({
								type: "game",
								info: "request",
								body: `${username} has invited you to play ${data.game_type}`,
								sender_id: data.sender_id,
								receiver_id: data.receiver_id,
								game_type: data.game_type,
								is_custom: data.is_custom,
								chat_id: data.chat_id,
								sent_at: data.sent_at,
								message_id: message_id,
							}))
						}
					}
				}
				else if (socketsChat.has(sender_id) && socketsChat.has(receiver_id) && data.info === "accept") {
					const invitation = await createMessage({
						body: "The invitation has been accepted",
						sender_id: data.sender_id,
						receiver_id: data.receiver_id,
						chat_id: data.chat_id,
						sent_at: data.sent_at,
						is_read: 0,
					})
					const message_id = invitation.id;
					const sender = socketsChat.get(sender_id);
					const receiver = socketsChat.get(receiver_id);
					sender.send(JSON.stringify({
						body: "The invitation has been accepted",
						message_id: message_id,
						chat_id: data.chat_id,
						receiver_id: data.sender_id,
						sender_id: userId,
						sender_username: username,
						sent_at: data.sent_at,
						read: false,
						type: "game",
						info: "accept",
						game_type: data.game_type
					}));
					receiver.send(JSON.stringify({
						body: "The invitation has been accepted",
						message_id: message_id,
						chat_id: data.chat_id,
						receiver_id: data.receiver_id,
						sender_id: userId,
						sender_username: username,
						sent_at: data.sent_at,
						read: false,
						type: "game",
						info: "accept",
						game_type: data.game_type
					}));
					let game = data.game_type.split('-')
					let game_type;
					let is_custom;
					if (game[0] !== "classic")
						is_custom = "custom";
					else
						is_custom = "classic";
					if (game[1] === "connect4")
						game_type = "connect_four"
					else
						game_type = game[1];
					await scheduleMatch({ game_type: game_type, custom_mode: is_custom, first_player_id: data.receiver_id, first_player_alias: receiver_username, second_player_alias: username, second_player_id: data.sender_id, host: receiver_username, tournament_id: 0, phase: null });
				}
				else if (socketsChat.has(sender_id) && socketsChat.has(receiver_id) && data.info === "reject") {
					const invitation = await createMessage({
						body: "The invitation has been rejected",
						sender_id: data.sender_id,
						receiver_id: data.receiver_id,
						chat_id: data.chat_id,
						sent_at: data.sent_at,
						is_read: 0,
					});
					const message_id = invitation.id;
					const sender = socketsChat.get(sender_id);
					const receiver = socketsChat.get(receiver_id);
					sender.send(JSON.stringify({
						body: "The invitation has been rejected",
						message_id: message_id,
						chat_id: data.chat_id,
						receiver_id: data.sender_id,
						sender_id: userId,
						sender_username: username,
						sent_at: data.sent_at,
						read: false,
						type: "game",
						info: "reject",
						game_type: data.game
					}));
					receiver.send(JSON.stringify({
						body: "The invitation has been rejected",
						message_id: message_id,
						chat_id: data.chat_id,
						receiver_id: data.receiver_id,
						sender_id: userId,
						sender_username: username,
						sent_at: data.sent_at,
						read: false,
						type: "game",
						info: "reject",
						game_type: data.game
					}));
				}
			}
		}
	}
}

async function friendRequest(data, sender_id, receiver_id) {
	if (data.info === "request") {
		if (socketsToast.has(receiver_id)) {
			let username = await getUsername(data.sender_id);
			const receiver = socketsToast.get(receiver_id);
			receiver.send(JSON.stringify({
				sender_id: data.sender_id,
				receiver_id: data.receiver_id,
				type: "friendRequest",
				body: `You have a friend request from ${username}`,
				info: "request",
			}))
		}
	}
	else if (socketsToast.has(sender_id)) {
		if (data.info === "confirmation") {
			const sender = socketsToast.get(sender_id);
			sender.send(JSON.stringify({
				type: "friendRequest",
				info: "confirmation"
			}))
		}
		else if (data.info === "delete") {
			const sender = socketsToast.get(sender_id);
			sender.send(JSON.stringify({
				type: "friendRequest",
				info: "delete",
			}))
		}
	}
}

async function tournamentHandle(data,) {
	socketsToast.forEach((clientSocket, clientId) => {
		try{
			if (clientId !== data.sender_id){
				clientSocket.send(JSON.stringify({

				}));
			}
		}
		catch(error){
			console.error("Error updating tournament page:", error);
		}
	})
}

async function handleAvatarChange(data) {
	let username = await getUsername(data.sender_id)
	socketsToast.forEach((clientSocket, clientId) => {
		try {
			if (clientId !== data.sender_id) {
				clientSocket.send(JSON.stringify({
					type: "change_avatar",
					sender_id: data.sender_id,
					receiver_id: clientId,
					avatar_url: data.avatar,
					username: username,
				}))
			}
		}
		catch (error) {
			console.error("Error while changing avatar:", error);
		}
	})
}

async function handleGameInvitation(data, sender_id) {

	let username = await getUsername(data.sender_id);
	let receiver_username = await getUsername(data.receiver_id);
	if (data.type === "game") {
		if (data.info === "request") {
			await createMessage({
				body: data.body,
				sender_id: data.sender_id,
				receiver_id: data.receiver_id,
				chat_id: data.chat_id,
				sent_at: data.sent_at,
				is_read: 0,
				invitation_type: "game",
				invitation_status: "pending",
				game_type: data.game_type,
			})
		}
		else if (socketsChat.has(sender_id) && data.info === "accept") {
			const invitation = await createMessage({
				body: "The invitation has been accepted",
				sender_id: data.receiver_id,
				receiver_id: data.sender_id,
				chat_id: data.chat_id,
				sent_at: data.sent_at,
				is_read: 0,
			})
			const message_id = invitation.id;
			const sender = socketsChat.get(sender_id);
			sender.send(JSON.stringify({
				body: "The invitation has been accepted",
				message_id: message_id,
				chat_id: data.chat_id,
				receiver_id: data.sender_id,
				sender_id: data.receiver_id,
				sender_username: username,
				sent_at: data.sent_at,
				read: false,
				type: "game",
				info: "accept",
				game_type: data.game
			}));
			let game = data.game_type.split('-')
			let game_type;
			let is_custom;
			if (game[0] !== "classic")
				is_custom = "custom";
			else
				is_custom = "classic";
			if (game[1] === "connect4")
				game_type = "connect_four"
			else
				game_type = game[1];
			await scheduleMatch({ game_type: game_type, custom_mode: is_custom, second_player_id: data.receiver_id, second_player_alias: receiver_username, first_player_id: data.sender_id, first_player_alias: username, host: username, tournament_id: 0, phase: null });
		}
		else if (socketsChat.has(sender_id) && data.info === "reject") {
			const invitation = await createMessage({
				body: "The invitation has been rejected",
				sender_id: data.receiver_id,
				receiver_id: data.sender_id,
				chat_id: data.chat_id,
				sent_at: data.sent_at,
				is_read: 0,
			});
			const message_id = invitation.id;
			const sender = socketsChat.get(sender_id);
			sender.send(JSON.stringify({
				body: "The invitation has been rejected",
				message_id: message_id,
				chat_id: data.chat_id,
				receiver_id: data.sender_id,
				sender_id: data.receiver_id,
				sender_username: username,
				sent_at: data.sent_at,
				read: false,
				type: "game",
				info: "reject",
				game_type: data.game
			}));
		}
	}
}

export default function createWebSocketsRoutes(fastify) {
	return [
		{
			url: "/chat",
			method: "GET",
			websocket: true,
			handler: asyncWebSocketHandler(async (socket) => {
				let userId = null;
				socket.on("message", async message => {
					const messageString = message.toString();
					const data = JSON.parse(messageString);
					if (userId === null) {
						try {
							userId = data.userId;
							if (userId) {
								socketsChat.set(userId, socket);
								socket.send(JSON.stringify({
									type: "connection",
									status: "success",
									message: "Connected"
								}));
							}
						}
						catch (err) {
							console.error("Error can't get ID:", err);
							socket.send(JSON.stringify({
								type: "error",
								message: "Invalid Id"
							}));
						}
					}
					else
						messageInChat(data, userId);
				})
				socket.on("close", () => {
					socketsChat.delete(userId);
				})
			})
		},
		{
			url: "/toast",
			method: "GET",
			websocket: true,
			handler: asyncWebSocketHandler(async (socket) => {
				let userId = null;
				socket.on("message", async notification => {
					const toast = notification.toString();
					const data = JSON.parse(toast);
					if (userId === null) {
						try {
							userId = data.userId;
							if (userId) {
								socketsToast.set(userId, socket);
								socket.send(JSON.stringify({
									type: "connection",
									status: "success",
									message: "Connected"
								}));
							}
						}
						catch (err) {
							console.error("Error can't get ID:", err);
							socket.send(JSON.stringify({
								type: "error",
								message: "Invalid Id"
							}));
						}
						if (userId)
							await patchUser(userId, { is_online: 1 });
						socketsToast.forEach((clientSocket, clientId) => {
							try {
								clientSocket.send(JSON.stringify({
									type: "friendStatusUpdate",
									userId: userId,
									status: "online",
									timestamp: new Date().toISOString()
								}));
							}
							catch (error) {
								console.error(`Error while notification ${clientId}:`, error);
							}
						});
					}
					else {
						const data = JSON.parse(notification);
						const sender_id = parseInt(data.sender_id);
						const receiver_id = parseInt(data.receiver_id);
						if (data.type === "friendRequest")
							friendRequest(data, sender_id, receiver_id);
						else if (data.type === "tournament")
							tournamentHandle(data, sender_id, receiver_id);
						else if (data.type === "change_avatar")
							handleAvatarChange(data)
						else if (data.type === "game")
							await handleGameInvitation(data, sender_id, receiver_id, fastify);
					}
				})
				socket.on("close", async () => {
					await patchUser(userId, { is_online: 0 });
					socketsToast.forEach((clientSocket, clientId) => {
						try {
							clientSocket.send(JSON.stringify({
								type: "friendStatusUpdate",
								userId: userId,
								status: "offline",
								timestamp: new Date().toISOString()
							}));
						}
						catch (error) {
							console.error(`Error while notification ${clientId}:`, error);
						}
					});
					socketsToast.delete(userId);
				})
			})
		},
	]
}
