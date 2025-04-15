import sqlite3 from "sqlite3";

const db = new sqlite3.Database("transcendence.db", (err) => {
  if (err) {
    return console.error("Error opening the database:", err.message);
  }
  console.log("Connected to the SQLite3 database.");
});

// Users
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    alias VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    google_id VARCHAR(255),
    avatar TEXT DEFAULT "/api/avatars/default.jpg",
    created_at DATETIME DEFAULT (datetime('now', '+2 hours')),
    is_online BOOLEAN DEFAULT 0,
    status TEXT DEFAULT "Hello World!",
    last_login DATETIME DEFAULT (datetime('now', '+2 hours')),
    reset_token TEXT,
    pending_totp_secret TEXT,
    totp_secret TEXT,
    is_2fa_enabled BOOLEAN DEFAULT 0,
    is_deleted BOOLEAN DEFAULT 0,
    wins INTEGER DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER DEFAULT 0 CHECK (losses >= 0)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("User table ready.");
    },
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS user_friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    starter_id INTEGER NOT NULL,
    pending BOOLEAN DEFAULT 1,
    PRIMARY KEY (user_id, friend_id),
    UNIQUE (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    FOREIGN KEY (starter_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Friend table ready.");
    },
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS user_blocks (
    user_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, blocked_id),
    UNIQUE (user_id, blocked_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (blocked_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Blocked users table ready.");
    },
  );
});

// Tournaments
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    player_limit INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'creating',
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', '+2 hours')),
    started_at DATETIME,
    finished_at DATETIME,
    FOREIGN KEY (creator_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Tournament table ready.");
    },
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS tournament_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    final_rank INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Tournament players table ready.");
    },
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS tournament_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL,
    invited_at DATETIME DEFAULT (datetime('now', '+2 hours')),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Tournament players table ready.");
    },
  );
});

// Matches
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type INTEGER,
    custom_mode INTEGER,
    first_player_id INTEGER NOT NULL,
    second_player_id INTEGER NOT NULL,
    first_player_score INTEGER NOT NULL,
    second_player_score INTEGER NOT NULL,
    turns_played INTEGER,
    winner_id INTEGER NOT NULL,
    loser_id INTEGER NOT NULL,
    tournament_id INTEGER,
    played_at DATETIME DEFAULT (datetime('now', '+2 hours')),
    FOREIGN KEY (first_player_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (second_player_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (loser_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Match table ready.");
    },
  );
});

// Chats
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_user_id INTEGER NOT NULL,
    second_user_id INTEGER NOT NULL,
    FOREIGN KEY (first_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (second_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(first_user_id, second_user_id)
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Chat table ready.");
    },
  );
});

// Messages
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    sent_at DATETIME DEFAULT (datetime('now', '+2 hours')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        return console.error("Error creating table:", err.message);
      }
      console.log("Message table ready.");
    },
  );
});

export default db;
