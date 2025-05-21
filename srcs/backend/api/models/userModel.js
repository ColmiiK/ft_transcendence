import bcrypt from "bcryptjs";
import db from "../database.js";
import assert from "node:assert/strict";
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
  assert(data !== undefined, "data must exist");
  data.password = await bcrypt.hash(data.password, 10);
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO users (username, email, password, language) VALUES (?,?,?,?)`;
    const params = [data.username, data.email, data.password, data.language];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting user:", err.message);
        return reject(err);
      }
      resolve({
        id: this.lastID,
        username: data.username,
        email: data.email,
        language: data.language,
      });
    });
  });
}

/**
 * Creates a user in the Google Sign In process
 * @param {Object} data - User to create
 * @returns {Object} - The newly created Google user
 */
export function createGoogleUser(data) {
  assert(data !== undefined, "data must exist");
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
  assert(id !== undefined, "id must exist");
  assert(data !== undefined, "data must exist");
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
  assert(id !== undefined, "id must exist");
  assert(updates !== undefined, "updates must exist");
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
      if (this.changes === 0) return resolve({ message: "No changes" });
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
  assert(id !== undefined, "id must exist");
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
 * Confirms the pending friendship between two users
 * @param {Number} id - ID of the user
 * @param {Number} friend_id - ID of the friend
 * @returns {Object} - Object with the IDs of the users
 */
export function acceptUserFriend(id, friend_id) {
  assert(id !== undefined, "id must exist");
  assert(friend_id !== undefined, "friend_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE
        user_friends
      SET
        pending = 0
      WHERE
        user_id = ? AND friend_id = ?
      OR
        user_id = ? AND friend_id = ?
    `;
    const params = [id, friend_id, friend_id, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user friends:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({
        success: true,
        user_id: id,
        friend_id: friend_id,
        pending: false,
      });
    });
  });
}

/**
 * Creates a pending friendship between two users
 * @param {Number} id - ID of the user
 * @param {Number} friend_id - ID of the friend
 * @returns {Object} - Status of query
 */
export function addUserFriendPending(id, friend_id) {
  assert(id !== undefined, "id must exist");
  assert(friend_id !== undefined, "friend_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO user_friends (user_id, friend_id, starter_id)
      VALUES (?,?,?), (?,?,?)`;
    const params = [id, friend_id, id, friend_id, id, id];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating user friends:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("User not found"));
      }
      resolve({
        success: true,
        user_id: id,
        friend_id: friend_id,
        pending: true,
      });
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
  assert(id !== undefined, "id must exist");
  assert(friend_id !== undefined, "friend_id must exist");
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
      resolve({ success: "friend removed" });
    });
  });
}

/**
 * Returns all blocked users
 * @param {Number} user_id - ID of the user
 * @returns {Object} - All blocked users of the main user
 */
export function getBlocks(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        u.id,
        u.username,
        u.avatar
      FROM
        users u
      JOIN
        user_blocks ub
          ON
            u.id = ub.blocked_id
      WHERE
        ub.user_id = ?
      AND
        u.is_deleted = 0
    `;
    db.all(sql, [user_id], function (err, rows) {
      if (err) {
        console.error("Error getting user blocks", err.message);
        return reject(err);
      }
      resolve(rows);
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
  assert(id !== undefined, "id must exist");
  assert(blocked_id !== undefined, "blocked_id must exist");
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
  assert(id !== undefined, "id must exist");
  assert(blocked_id !== undefined, "blocked_id must exist");
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
  assert(user_id !== undefined, "user_id must exist");
  assert(blocked_id !== undefined, "blocked_id must exist");
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
 * Checks if a user is a friend of another
 * @param {Number} user_id - ID of the user
 * @param {Number} friend_id - ID of the possible friend
 * @returns {Boolean} - true if the users are friends,
 *                      false if they aren't
 */
export function isFriend(user_id, friend_id) {
  assert(user_id !== undefined, "user_id must exist");
  assert(friend_id !== undefined, "friend_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM
          user_friends
        WHERE
          user_id = ? AND friend_id = ? AND pending = 0
        OR
          user_id = ? AND friend_id = ? AND pending = 0)
      AS is_friend;`;
    const params = [user_id, friend_id, friend_id, user_id];
    db.get(sql, params, function (err, row) {
      if (err) {
        console.error("Error accessing user_friends:", err.message);
        return reject(err);
      }
      resolve(row.is_friend === 1);
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
  assert(identifier !== undefined, "identifier must exist");
  return new Promise((resolve, reject) => {
    let whereClause;

    if (
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

/**
 * Finds all users that start with the given username
 * @param {String} username - Partial username to look for
 * @param {Number} user_id - ID of the original user
 * @returns {Array} - Found users
 */
export function findMatchingUsers(username, user_id) {
  assert(username !== undefined, "username must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        u.id AS user_id,
        u.username,
        u.avatar,
        CASE
          WHEN uf1.friend_id IS NOT NULL THEN 
            CASE 
              WHEN uf1.pending = 1 THEN 2
              ELSE 1
            END
          WHEN uf2.user_id IS NOT NULL THEN
            CASE
              WHEN uf2.pending = 1 THEN 3
              ELSE 1
            END
          ELSE 0
        END AS is_friend
      FROM
        users u
      LEFT JOIN
        user_friends uf1 ON u.id = uf1.friend_id AND uf1.user_id = ?
      LEFT JOIN
        user_friends uf2 ON u.id = uf2.user_id AND uf2.friend_id = ?
      WHERE
        u.username LIKE ?
      AND
        u.is_deleted = 0
      AND
        u.id IS NOT ?
    `;
    db.all(sql, [user_id, user_id, username + "%", user_id], (err, rows) => {
      if (err) {
        console.error("Error getting users:", err.message);
        return reject(err);
      }
      const blockingPromises = rows.map(async (row) => {
        const blocked =
          (await isBlocked(user_id, row.user_id)) ||
          (await isBlocked(row.user_id, user_id));
        return { row, blocked };
      });
      Promise.all(blockingPromises).then((results) => {
        const filteredRows = results
          .filter((result) => !result.blocked)
          .map((result) => result.row);
        resolve(filteredRows);
      });
    });
  });
}

/**
 * Returns the username of the given user
 * @param {Number} id - ID of the user
 * @returns {String} - Username of user
 */
export function getUsername(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        username,
        is_deleted
      FROM
        users
      WHERE
        id = ?
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("error getting user:", err.message);
        return reject(err);
      }
      if (!row) return resolve(null);
      if (row.is_deleted) return resolve("anonymous");
      resolve(row.username);
    });
  });
}

/**
 * Returns all friends of the given user
 * @param {Number} id - ID of the user
 * @returns {Array} - All friends of user
 */
export function getUserFriends(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT
        u.id AS user_id,
        u.username,
        u.status,
        u.avatar,
        u.is_online
      FROM
        users u
      JOIN
        user_friends uf ON (u.id = uf.friend_id AND uf.user_id = ?)
        OR (u.id = uf.user_id AND uf.friend_id = ?)
      WHERE
        uf.pending = 0
        AND u.is_deleted = 0
    `;
    db.all(sql, [id, id], (err, rows) => {
      if (err) {
        console.error("Error getting users:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Returns the profile of a friend, with game stats
 * @param {Number} friend_id - ID of the friend
 * @returns {Object} - The profile of the friend
 */
export function getFriendOfUser(friend_id) {
  assert(friend_id !== undefined, "friend_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        u.id AS user_id,
        u.username,
        u.alias,
        u.status,
        u.avatar,
        u.is_online
      FROM
        users u
      WHERE
        id = ?
      AND
        u.is_deleted = 0
    `;
    db.get(sql, [friend_id], (err, row) => {
      if (err) {
        console.error("error getting user:", err.message);
        return reject(err);
      }
      // Don't harcode this, figure out matches table
      Object.assign(row, {
        pong_games_played: 4,
        pong_games_won: 2,
        pong_games_lost: 2,
        connect_four_games_played: 2,
        connect_four_games_won: 1,
        connect_four_games_lost: 1,
      });
      resolve(row);
    });
  });
}

/**
 * Returns all the invitations the user has received or sent
 * @param {Number} id - ID of the user
 * @returns {Object} - All found invitations
 */
export function getInvitationsOfUser(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT
        f.starter_id AS sender_id,
        u1.username AS sender_username,
        u1.avatar AS sender_avatar,
        u1.status AS sender_status,
        u1.is_deleted AS sender_deleted,
      CASE 
        WHEN f.starter_id = f.user_id THEN f.friend_id
        ELSE f.user_id
      END AS 
        receiver_id,
        u2.username AS receiver_username,
        u2.avatar AS receiver_avatar,
        u2.status AS receiver_status,
        u2.is_deleted AS receiver_deleted,
      CASE 
        WHEN f.starter_id = ? THEN 'sent'
        ELSE 'received'
      END AS
        invitation_type
      FROM
        user_friends f
      JOIN users u1 ON f.starter_id = u1.id
      JOIN users u2 ON (CASE WHEN f.starter_id = f.user_id THEN f.friend_id ELSE f.user_id END) = u2.id
      WHERE (f.user_id = ? OR f.friend_id = ?)
      AND f.pending = 1
      AND sender_deleted = 0 AND receiver_deleted = 0
      ORDER BY invitation_type, u1.username
    `;
    db.all(sql, [id, id, id], (err, rows) => {
      if (err) {
        console.error("Error getting users:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Returns the profile of the user
 * @param {Number} id - ID of the user
 * @returns {Object} - Profile information of user
 */
export function getProfileOfUser(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        id,
        username,
        avatar,
        alias AS nick,
        status AS description,
        created_at,
        wins,
        losses
      FROM
        users
      WHERE
        id = ?
    `;
    db.get(sql, [id], function (err, row) {
      if (err) {
        console.error("Error getting user:", err.message);
        return reject(err);
      }
      resolve(row);
    });
  });
}

export function increaseWins(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
    UPDATE
      users
    SET
      wins = wins + 1
    WHERE
      id = ?
  `;
    db.run(sql, user_id, function (err) {
      if (err) {
        console.error("Error updating wins:", err.message);
        return reject(err);
      }
      if (this.changes === 0) return resolve({ message: "No changes" });
      resolve({ success: "Wins incremented" });
    });
  });
}

export function increaseLosses(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
    UPDATE
      users
    SET
      losses = losses + 1
    WHERE
      id = ?
  `;
    db.run(sql, user_id, function (err) {
      if (err) {
        console.error("Error updating losses:", err.message);
        return reject(err);
      }
      if (this.changes === 0) return resolve({ message: "No changes" });
      resolve({ success: "Losses incremented" });
    });
  });
}
