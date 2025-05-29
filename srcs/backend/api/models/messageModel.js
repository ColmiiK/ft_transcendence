import db from "../database.js";
import assert from "node:assert/strict";

/**
 * Finds all avaliable messages
 * @returns {Array} - All avaliable messages
 */
export function getMessages() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM messages";

    db.all(sql, (err, rows) => {
      if (err) {
        console.error("Error getting messages:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Creates a message
 * @param {Object} data - IDs of the sender, chat and body of the message
 * @returns {Object} - Newly created message
 */
export function createMessage(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO messages (
        sender_id,
        receiver_id,
        chat_id,
        body,
        invitation_type,
        invitation_status,
        game_type
      ) VALUES (?,?,?,?,?,?,?)`;
    const params = [
      data.sender_id,
      data.receiver_id,
      data.chat_id,
      data.body,
      data?.invitation_type || "message",
      data?.invitation_status,
      data?.game_type
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting message:", err.message);
        return reject(err);
      }
      resolve({
        id: this.lastID,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        chat_id: data.chat_id,
        body: data.body,
        sent_at: data.sent_at,
        is_read: data.is_read,
      });
    });
  });
}

/**
 * Finds a message by a given ID
 * @param {Number} id - ID of the message
 * @returns {Object} - Found message
 */
export function getMessageByID(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM messages WHERE id = ?";

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("Error getting message:", err.message);
        return reject(err);
      }
      resolve(row);
    });
  });
}

/**
 * Fully modifies a message
 * @param {Number} id - ID of the message
 * @param {Object} data - IDs of the sender, chat and body of the message
 * @returns {Object} - Modified message
 */
export function putMessage(id, data) {
  assert(id !== undefined, "id must exist");
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE messages
      SET sender_id = ?, chat_id = ?, body = ?
      WHERE id = ?
    `;
    const params = [data.sender_id, data.chat_id, data.body, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating message:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Message not found"));
      }
      resolve(getMessageByID(id));
    });
  });
}

/**
 * Modifies one or more fields of a message
 * @param {Number} id - ID of the message
 * @param {Object} updates - Field(s) to modify
 * @returns {Object} - Modified fields
 */
export function patchMessage(id, updates) {
  assert(id !== undefined, "id must exist");
  assert(updates !== undefined, "updates must exist");
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const params = Object.values(updates);
    params.push(id);
    const sql = `
      UPDATE messages
      SET ${fields}
      WHERE id = ?
    `;
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating message:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Message not found"));
      }
      resolve({ id, ...updates });
    });
  });
}
/**
 * Deletes a message by a given ID
 * @param {Number} id - ID of the message
 * @returns {Promise} - Nothing on success,
 *                      error on failure
 */
export function deleteMessage(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM messages
      WHERE id = ?
    `;
    db.run(sql, id, function (err) {
      if (err) {
        console.error("Error deleting message:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Message not found"));
      }
      resolve();
    });
  });
}

/**
 * Returns all avaliable chats and messages of
 * those chats of a given user
 * @param {Number} id - ID of the user
 * @returns {Array} - An array of chats, with an array messages inside
 */
export function getMessagesOfUser(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
      c.id AS chat_id,
      c.first_user_id,
      c.second_user_id,
      first_user.username AS first_username,
      first_user.is_deleted AS first_user_deleted,
      second_user.username AS second_username,
      second_user.is_deleted AS second_user_deleted,
      m.id AS message_id,
      m.sender_id,
      m.receiver_id,
      sender.username AS sender_username,
      sender.is_deleted AS sender_deleted,
      receiver.username AS receiver_username,
      receiver.is_deleted AS receiver_deleted,
      m.body,
      m.sent_at
      FROM chats c
      JOIN users first_user ON c.first_user_id = first_user.id
      JOIN users second_user ON c.second_user_id = second_user.id
      JOIN messages m ON c.id = m.chat_id
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE c.first_user_id = ? OR c.second_user_id = ?
      ORDER BY c.id, m.sent_at
      `;
    db.all(sql, [id, id], (err, rows) => {
      if (err) {
        console.error("Error getting chats and messages of user:", err.message);
        return reject(err);
      }
      const chatMap = {};
      rows.forEach((row) => {
        if (!chatMap[row.chat_id]) {
          const first_user_id = row.first_user_id;
          const second_user_id = row.second_user_id;

          let receiverUsername;
          if (id === first_user_id) {
            receiverUsername = row.second_user_deleted
              ? "anonymous"
              : row.second_username;
          } else {
            receiverUsername = row.first_user_deleted
              ? "anonymous"
              : row.first_username;
          }
          chatMap[row.chat_id] = {
            chat_id: row.chat_id,
            receiver: receiverUsername,
            first_user_id: row.first_user_id,
            first_username: row.first_user_deleted
              ? "anonymous"
              : row.first_username,
            second_user_id: row.second_user_id,
            second_username: row.second_user_deleted
              ? "anonymous"
              : row.second_username,
            messages: [],
          };
        }
        chatMap[row.chat_id].messages.push({
          message_id: row.message_id,
          sender_id: row.sender_id,
          sender_username: row.sender_deleted
            ? "anonymous"
            : row.sender_username,
          receiver_id: row.receiver_id,
          receiver_username: row.receiver_deleted
            ? "anonymous"
            : row.receiver_username,
          body: row.body,
          sent_at: row.sent_at,
        });
      });
      resolve({ chats: chatMap });
    });
  });
}
