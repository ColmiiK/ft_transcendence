import db from "../database.js";
import assert from "node:assert/strict";
import { patchMessage } from "./messageModel.js";
import { getUsername } from "./userModel.js";

/**
 * Finds all avaliable chats
 * @returns {Array} - All avaliable rows
 */
export function getChats() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM chats";

    db.all(sql, (err, rows) => {
      if (err) {
        console.error("Error getting chats:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Creates a chat between two users,
 * ensuring uniqueness by ordering the IDs
 * @param {Object} data - IDs of the users
 * @returns {Object} - Newly created chat
 */
export function createChat(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const first_id = Math.min(data.first_user_id, data.second_user_id);
    const second_id = Math.max(data.first_user_id, data.second_user_id);
    const sql = `INSERT INTO chats (first_user_id, second_user_id) VALUES (?,?)`;
    const params = [first_id, second_id];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting chat:", err.message);
        return reject(err);
      }
      resolve({
        id: this.lastID,
        first_user_id: first_id,
        second_user_id: second_id,
      });
    });
  });
}

/**
 * Finds a chat by a given ID if it exists
 * @param {Number} id - ID of the chat
 * @returns {Object} - Found chat
 */
export function getChatByID(id, limit, offset, markAsRead) {
  assert(id !== undefined, "id must exist");
  return new Promise(async (resolve, reject) => {
    const sql = `
SELECT q.* FROM (
        SELECT
          m.id AS message_id,
          m.sender_id,
          m.receiver_id,
          m.body,
          m.sent_at,
          m.is_read,
          m.invitation_type,
          m.invitation_status,
          s.username AS sender_username,
          s.is_deleted AS sender_deleted,
          r.username AS receiver_username,
          r.is_deleted AS receiver_deleted
        FROM
          messages m
        JOIN
          users s ON m.sender_id = s.id
        JOIN
          users r ON m.receiver_id = r.id
        WHERE
          m.chat_id = ?
        ORDER BY
          m.sent_at DESC
        LIMIT ? OFFSET ?) q
ORDER BY q.sent_at ASC
`;
    db.all(sql, [id, limit, offset], async (err, rows) => {
      if (err) {
        console.error("Error getting chat:", err.message);
        return reject(err);
      }
      for (let message of rows) {
        if (!message.is_read)
          await patchMessage(message.message_id, { is_read: 1 });
      }
      rows.forEach((row) => {
        row.sender_username = row.sender_deleted
          ? "anonymous"
          : row.sender_username;
        row.receiver_username = row.receiver_deleted
          ? "anonymous"
          : row.receiver_username;
      });
      resolve(rows);
    });
  });
}

/**
 * Fully replaces a chat
 * @param {Number} id - ID of the chat
 * @param {Object} data - Data to replace with
 * @returns {Object} - Modified chat
 */
export function putChat(id, data) {
  assert(id !== undefined, "id must exist");
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const first_id = Math.min(data.first_user_id, data.second_user_id);
    const second_id = Math.max(data.first_user_id, data.second_user_id);
    const sql = `
      UPDATE chats
      SET first_user_id = ?, second_user_id = ?
      WHERE id = ?
    `;
    const params = [first_id, second_id, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating chat:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Chat not found"));
      }
      resolve(getChatByID(id));
    });
  });
}

/**
 * Modifies one or more fields of a chat
 * @param {Number} id - ID of the chat
 * @param {Object} updates - Field(s) to modify
 * @returns {Object} - Modified fields
 */
export function patchChat(id, updates) {
  assert(id !== undefined, "id must exist");
  assert(updates !== undefined, "updates must exist");
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const params = Object.values(updates);
    params.push(id);
    const sql = `
      UPDATE chats
      SET ${fields}
      WHERE id = ?
    `;
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating chat:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Chat not found"));
      }
      resolve({ id, ...updates });
    });
  });
}

/**
 * Deletes a chat
 * @param {Number} id - ID of the chat
 * @returns {Promise} - Nothing on success,
 *                      error on failure
 */
export function deleteChat(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM chats
      WHERE id = ?
    `;
    db.run(sql, id, function (err) {
      if (err) {
        console.error("Error deleting chat:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Chat not found"));
      }
      resolve();
    });
  });
}

/**
 * Returns all found chats of a user
 * @param {Number} id - ID of the user
 * @returns {Array} - All found chats
 */
export function getChatsOfUser(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = ` SELECT * FROM chats WHERE first_user_id = ? OR second_user_id = ?`;
    db.all(sql, [id, id], (err, rows) => {
      if (err) {
        console.error("Error getting chats:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Gets all chats of user and the last message of them
 * @param {Number} id - ID of the user
 * @returns {Object} - All chats with the last message,
 *                     sorted by date
 */
export function getLastChatsOfUser(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      WITH RankedMessages AS (
        SELECT
          c.id AS chat_id,
          CASE 
            WHEN c.first_user_id = ?
              THEN second_user.username
              ELSE first_user.username
            END AS friend_username,
          CASE 
            WHEN c.first_user_id = ?
              THEN second_user.id
              ELSE first_user.id
            END AS friend_id,
          CASE 
            WHEN c.first_user_id = ?
              THEN second_user.avatar
              ELSE first_user.avatar
            END AS friend_avatar,
          sender.username AS sender_username,
          sender.is_deleted AS sender_deleted,
          receiver.is_deleted AS receiver_deleted,
          m.body,
          m.sent_at,
          m.is_read,
          ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY m.sent_at DESC) AS message_rank
        FROM chats c
        JOIN users first_user ON c.first_user_id = first_user.id
        JOIN users second_user ON c.second_user_id = second_user.id
        JOIN messages m ON c.id = m.chat_id
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE c.first_user_id = ? OR c.second_user_id = ?
      )
      SELECT 
        chat_id,
        sender_deleted,
        receiver_deleted,
        friend_username,
        friend_avatar,
        friend_id,
        sender_username, 
        body, 
        sent_at,
        is_read
      FROM RankedMessages
      WHERE message_rank = 1
      ORDER BY sent_at DESC
`;
    db.all(sql, [id, id, id, id, id], (err, rows) => {
      if (err) {
        console.error("Error getting chats:", err.message);
        return reject(err);
      }
      rows.forEach((row) => {
        row.friend_username =
          row.receiver_deleted || row.sender_deleted
            ? "anonymous"
            : row.friend_username;
        delete row.message_rank;
        delete row.sender_deleted;
        delete row.receiver_deleted;
      });
      resolve(rows);
    });
  });
}

/**
 * Returns the ID of the chat between two users, if it exists
 * @param {Number} user_id - ID of the user
 * @param {Number} friend_id - ID of the other user
 * @returns {Number} - ID of the found chat
 */
export async function getChatBetweenUsers(user_id, friend_id) {
  assert(user_id !== undefined, "user_id must exist");
  assert(friend_id !== undefined, "friend_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT id
    FROM chats
    WHERE
      first_user_id = ? AND second_user_id = ?
    OR
      first_user_id = ? AND second_user_id = ?
    `;
    db.get(sql, [user_id, friend_id, friend_id, user_id], (err, row) => {
      if (err) {
        console.error("Error getting chats:", err.message);
        return reject(err);
      }
      if (!row || !row.id) resolve(null);
      resolve(row.id);
    });
  });
}

/**
 * Checks if there is a chat between any two users
 * @param {Number} first_user_id - ID of the first user
 * @param {Number} second_user_id - ID of the second user
 * @returns {Boolean} - true if there is a chat,
 *                      false if there isn't
 */
export function isChat(first_user_id, second_user_id) {
  assert(first_user_id !== undefined, "first_user_id must exist");
  assert(second_user_id !== undefined, "second_user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM
          chats
        WHERE
          first_user_id = ? AND second_user_id = ?
        OR
          first_user_id = ? AND second_user_id = ?)
      AS is_chat;`;
    const params = [
      first_user_id,
      second_user_id,
      second_user_id,
      first_user_id,
    ];
    db.get(sql, params, function (err, row) {
      if (err) {
        console.error("Error accessing chats:", err.message);
        return reject(err);
      }
      resolve(row.is_chat === 1);
    });
  });
}

/**
 * Returns all avaliable information for the given chat,
 * including the ID of the other user
 * @param {Number} id - ID of the chat
 * @param {Number} user_id - ID of the user
 * @returns {Object} - The found chat
 */
export function getInfoAboutChat(id, user_id) {
  assert(id !== undefined, "id must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        *
      FROM
        chats
      WHERE
        id = ?
    `;
    db.get(sql, [id], async function (err, row) {
      if (err) {
        console.error("Error accessing chats:", err.message);
        return reject(err);
      }
      const first_user_username = await getUsername(row.first_user_id);
      const second_user_username = await getUsername(row.second_user_id);
      const friend_id =
        row.first_user_id === user_id ? row.second_user_id : row.first_user_id;
      Object.assign(row, {
        first_user_username,
        second_user_username,
        friend_id,
      });
      resolve(row);
    });
  });
}
