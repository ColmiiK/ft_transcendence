import { db } from "../database.js";

export function createUser(username, email, password) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO users (username, email, password) VALUES (?,?,?)";
    const params = [username, email, password];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting user:", err.message);
        return reject(err);
      }
      resolve({ id: this.lastID, username, email });
    });
  });
}

export function getUserByID(id) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE id = ?";

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("Error getting user:", err.message);
        return reject(err);
      }
      resolve(row);
    });
  });
}

export function getUsers() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users";

    db.all(sql, (err, rows) => {
      if (err) {
        console.error("Error getting user:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export function putUser(id, username, email, password) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users
      SET username = ?, email = ?, password = ?
      WHERE id = ?
    `;
    const params = [username, email, password, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({ id, username, email });
    });
  });
}

export function deleteUser(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM users
      WHERE id = ?
    `;
    db.run(sql, id, function (err) {
      if (err) {
        console.error("Error deleting user:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve();
    });
  });
}
