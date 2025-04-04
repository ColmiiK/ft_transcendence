export interface LoginObject {
	username: string;
	password: string;
}

export interface LastMessage {
	body: string;
	chat_id: number;
	sender_username: string;
	friend_username: string;
	sent_at: string;	
}

export interface Chat {
	chat_id: number;
	first_user_id: number;
	first_username: string;
	messages: Array;
	second_user_id: number;
	second_username: string;
	receiver: string;
	socket: WebSocket | null;
}

export interface ChatInfo {
	id: number;
	first_user_id: number;
	second_user_id: number;
	first_user_username: string;
	second_user_username: string;
	friend_id: number;
}

export interface Message {
	body: string;
	message_id?: number;
	chat_id: number;
	receiver_id: number;
	receiver_username?: string;
	sender_id: number;
	sender_username?: string;
	sent_at: string;
	read?: boolean;
}

export interface MessageObject {
	chat_id: number;
	friend_username: string;
}

export interface User {
	user_id: number;
	socket: WebSocket | null;
}

export interface UserMatches {
	user_id: number;
	username: string;
	avatar: string;
	is_friend: number;
}

export interface FriendList {
	user_id: number;
	username: string;
	alias?: string;
	status: string | null;
	avatar: string;
	is_online: number;
	pong_games_played?: number;
	pong_games_won?: number;
	pong_games_lost?: number;
	connect_four_games_played?: number;
	connect_four_games_won?: number;
	connect_four_games_lost?: number;
}

export interface InvitationList {
	sender_id: number;
	sender_username: string;
	sender_status: string;
	sender_avatar: string;
	receiver_id: number;
	receiver_username: string;
	receiver_status: string;
	receiver_avatar: string;
	invitation_type: string;
}
