import db from "../database.js";

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

export function createChat(data) {
  return new Promise((resolve, reject) => {
    // Ensuring unique chats between two people
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

export function getChatByID(id) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM chats WHERE id = ?";

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("Error getting chat:", err.message);
        return reject(err);
      }
      resolve(row);
    });
  });
}

export function putChat(id, data) {
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

export function patchChat(id, updates) {
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

export function deleteChat(id) {
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

export function getChatsOfUser(id) {
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
