import bcrypt from "bcryptjs";
import db from "../database.js";
import { anonymize } from "../utils.js";

/**
 * Returns the ID, username and email of all avaliable users
 * @returns {Array} - All avaliable users
 */
export function getUsers() {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT u.id, u.username, u.email, u.is_deleted FROM users u `;
    db.all(sql, (err, rows) => {
      if (err) {
        console.error("Error getting users:", err.message);
        return reject(err);
      }
      rows.forEach(anonymize);
      resolve(rows);
    });
  });
}

/**
 * Creates a user, hashing the password in the process
 * @param {Object} data - User to create
 * @returns {Object} - The newly created user
 */
export async function createUser(data) {
  data.password = await bcrypt.hash(data.password, 10);
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO users (username, email, password) VALUES (?,?,?)`;
    const params = [data.username, data.email, data.password];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting user:", err.message);
        return reject(err);
      }
      resolve({ id: this.lastID, username: data.username, email: data.email });
    });
  });
}

export function createGoogleUser(data) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO users (username, email, google_id) VALUES (?,?,?)`;
    const params = [data.username, data.email, data.googleId];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting user:", err.message);
        return reject(err);
      }
      resolve({ id: this.lastID, username: data.username, email: data.email });
    });
  });
}

/**
 * Fully modifies a user
 * @param {Number} id - ID of the user
 * @param {Object} data - User data to modify
 * @returns {Object} - The modified user
 */
export async function putUser(id, data) {
  data.password = await bcrypt.hash(data.password, 10);
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users
      SET username = ?, email = ?, password = ?
      WHERE id = ?
    `;
    const params = [data.username, data.email, data.password, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve(getUser(id));
    });
  });
}

/**
 * Patches a user with the given information
 * @param {Number} id - ID of the user
 * @param {Object} updates - Fields to change
 * @returns {Object} - Modified fields
 */
export async function patchUser(id, updates) {
  if (updates.hasOwnProperty("password")) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const params = Object.values(updates);
    params.push(id);
    const sql = `
      UPDATE users
      SET ${fields}
      WHERE id = ?
    `;
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({ success: true, id, ...updates });
    });
  });
}

/**
 * Sets the deletion flag of a user to true
 * @param {Number} id - ID of the user
 * @returns {Promise} - Nothing on success,
 *                      error on failure
 */
export function deleteUser(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users
      SET is_deleted = 1
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

/**
 * Adds a friend to a user
 * @param {Number} id - ID of the user
 * @param {Number} friend_id - ID of the friend
 * @returns {Object} - Object with the IDs of the users
 */
export function addUserFriend(id, friend_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO user_friends (user_id, friend_id)
      VALUES (?,?), (?,?)`;
    const params = [id, friend_id, friend_id, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user friends:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({ success: true, user_id: id, friend_id: friend_id });
    });
  });
}
/**
 * Deletes a friend for a user
 * @param {Number} id - ID of the user
 * @param {Number} friend_id - ID of the friend
 * @returns {Object} - Object on success,
 *                     error on failure
 */
export function removeUserFriend(id, friend_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM user_friends
      WHERE (user_id = ? AND friend_id = ?)
      OR (user_id = ? AND friend_id = ?)`;
    const params = [id, friend_id, friend_id, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user friends:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({ success: "friend removed" });
    });
  });
}

/**
 * Adds a user to the blocked list of another
 * @param {Number} id - ID of the user
 * @param {Number} blocked_id - ID of the blocked user
 * @returns {Object} - IDs of the relevant users
 */
export function addUserBlock(id, blocked_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO user_blocks (user_id, blocked_id)
      VALUES (?,?)`;
    const params = [id, blocked_id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user blocks:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({ success: true, user_id: id, blocked_id: blocked_id });
    });
  });
}

/**
 * Removes a user from the blocked list of another
 * @param {Number} id - ID of the user
 * @param {Number} blocked_id - ID of the blocked user
 * @returns {Promise} - Nothing on success,
 *                      error on failure
 */
export function removeUserBlock(id, blocked_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM user_blocks
      WHERE (user_id = ? AND blocked_id = ?)`;
    const params = [id, blocked_id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user blocks:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({ success: "block removed" });
    });
  });
}

/**
 * Checks if a user has another blocked
 * @param {Number} user_id - ID of the user
 * @param {Number} blocked_id - ID of the possibly blocked user
 * @returns {Boolean} - true if it is blocked,
 *                      false if it isn't
 */
export function isBlocked(user_id, blocked_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT EXISTS (
      SELECT 1
      FROM user_blocks
      WHERE user_id = ? AND blocked_id = ?)
      AS is_blocked;`;
    const params = [user_id, blocked_id];
    db.get(sql, params, function (err, row) {
      if (err) {
        console.error("Error accessing user_blocks:", err.message);
        return reject(err);
      }
      resolve(row.is_blocked === 1);
    });
  });
}

/**
 * Finds a user by a given ID, username, or email, keeping or not their credentials
 * @param {Any} identifier - ID, username or email of the user
 * @param {Boolean} keepCredentials - True if you want to keep credentials,
 *                                    defaults to false
 * @returns {Object} - The found user, null if it doesn't exist
 */
export function getUser(identifier, keepCredentials = null) {
  return new Promise((resolve, reject) => {
    let whereClause;

    if (identifier === undefined || identifier === null)
      return reject(new Error("Identifier is required in getUser()"));
    else if (
      typeof identifier === "number" ||
      (typeof identifier === "string" && /^\d+$/.test(identifier))
    )
      whereClause = "u.id = ?";
    else if (typeof identifier === "string" && identifier.includes("@"))
      whereClause = "u.email = ?";
    else if (typeof identifier === "string") whereClause = "u.username = ?";
    else return reject(new Error("Invalid identifier type"));
    const sql = `
      SELECT u.*,
      GROUP_CONCAT(DISTINCT uf.friend_id) AS friends_ids,
      GROUP_CONCAT(DISTINCT ub.blocked_id) AS blocked_ids
      FROM users u
      LEFT JOIN user_friends uf ON u.id = uf.user_id
      LEFT JOIN user_blocks ub ON u.id = ub.user_id
      WHERE ${whereClause}
      GROUP BY u.id`;
    db.get(sql, [identifier], (err, row) => {
      if (err) {
        console.error("error getting user:", err.message);
        return reject(err);
      }
      if (!row) return resolve(null);
      const user = {
        ...row,
        friends: row.friends_ids ? row.friends_ids.split(",").map(Number) : [],
        blocks: row.blocked_ids ? row.blocked_ids.split(",").map(Number) : [],
      };
      delete user.friends_ids;
      delete user.blocked_ids;
      if (!keepCredentials) {
        delete user.password;
        delete user.totp_secret;
        delete user.google_id;
      }
      anonymize(user);

      const result = Object.assign({}, user, { success: true });
      resolve(result);
    });
  });
}
