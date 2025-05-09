export interface LoginObject {
	username: string;
	password: string;
}

export interface LastMessage {
	body: string;
	chat_id: number;
	sender_username: string;
	friend_username: string;
	friend_avatar: string;
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
	read: boolean;
	type?: string;
	info?: string;
	tournament?: Tournament | null;
}

export interface MessageObject {
	chat_id: number;
	friend_username: string;
  friend_avatar: string;
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
	is_invited?: boolean;
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

export interface Tournament {
	id: number,
  name: string,
  player_amount: number,
}

interface Tournament {
	tournament_id: number;
	name: string;
	player_amount: number;
	player_limit: number;
	status: string;
	game_type: string;
	creator_id: number;
	created_at: string;
	started_at: string | null;
	finished_at: string | null;
	tournament_invitations: { user_id: number; status: string; }[];
	tournament_participants: { user_id: number; final_rank: number | null; }[];
	tournament_matches: any[]; // Add specific type if needed
}

export interface Blocked {
	username: string,
	id: number,
	avatar: string,
}

export interface Games {
	isCustom: string,
	gameMode: string,
}
