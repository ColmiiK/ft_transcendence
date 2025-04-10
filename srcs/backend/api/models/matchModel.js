import db from "../database.js";
import assert from "node:assert/strict";

/**
 * Finds all avaliable matches
 * @returns {Array} - All avaliable rows
 */
export function getMatchs() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM matches";

    db.all(sql, (err, rows) => {
      if (err) {
        console.error("Error getting matches:", err.message);
        return reject(err);
      }
      const matches = rows.map((row) => ({
        ...row,
        result: row.result
          ? row.result.split(",").map((id) => parseInt(id))
          : [],
      }));
      resolve(matches);
    });
  });
}

/**
 * Creates a match
 * @param {Object} data - IDs and result of the match
 * @returns {Object} - Newly created match
 */
export function createMatch(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO matches (
        game_type,
        custom_mode,
        turns_played,
        first_player_id,
        second_player_id,
        first_player_score,
        second_player_score,
        winner_id,
        loser_id)
      VALUES (?,?,?,?,?,?,?,?,?)
    `;
    const params = [
      data.game_type,
      data.custom_mode,
      data.turns_played,
      data.first_player_id,
      data.second_player_id,
      data.first_player_score,
      data.second_player_score,
      data.winner_id,
      data.loser_id,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting match:", err.message);
        return reject(err);
      }
      resolve({
        id: this.lastID,
        game_type: data.game_type,
        custom_mode: data.custom_mode,
        turns_played: data.turns_played,
        first_player_id: data.first_player_id,
        second_player_id: data.second_player_id,
        first_player_score: data.first_player_score,
        second_player_score: data.second_player_score,
        winner_id: data.winner_id,
        loser_id: data.loser_id,
      });
    });
  });
}

/**
 * Finds a match by a given ID
 * @param {Number} id - ID of the match
 * @returns {Object} - Found match
 */
export function getMatchByID(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM matches WHERE id = ?";

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("Error getting match:", err.message);
        return reject(err);
      }
      if (row && row.result) {
        row.result = row.result.split(",").map((id) => parseInt(id));
      }
      resolve(row);
    });
  });
}

/**
 * Fully modifies a match
 * @param {Number} id - ID of the match
 * @param {Object} data - IDs and result of the match
 * @returns {Object} - Modified match
 */
export function putMatch(id, data) {
  assert(id !== undefined, "id must exist");
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE matches
      SET left_player_id = ?, right_player_id = ?, result = ?, winner_id = ?, loser_id = ?
      WHERE id = ?
    `;
    const params = [
      data.left_player_id,
      data.right_player_id,
      data.result,
      data.winner_id,
      data.loser_id,
      id,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating match:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Match not found"));
      }
      resolve(getMatchByID(id));
    });
  });
}

/**
 * Modifies one or more fields of a match
 * @param {Number} id - ID of the match
 * @param {Object} updates - Fields to modify
 * @returns {Object} - Modified fields
 */
export function patchMatch(id, updates) {
  assert(id !== undefined, "id must exist");
  assert(updates !== undefined, "updates must exist");
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const params = Object.values(updates);
    params.push(id);
    const sql = `
      UPDATE matches
      SET ${fields}
      WHERE id = ?
    `;
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating match:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Match not found"));
      }
      resolve({ id, ...updates });
    });
  });
}
/**
 * Deletes a match
 * @param {Number} id - ID of the match
 * @returns {Promise} - Nothing on success,
 *                      error on failure
 */
export function deleteMatch(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM matches
      WHERE id = ?
    `;
    db.run(sql, id, function (err) {
      if (err) {
        console.error("Error deleting match:", err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        return reject(new Error("Match not found"));
      }
      resolve();
    });
  });
}

/**
 * Finds all matches of a given user
 * @param {Number} id - ID of the user
 * @returns {Array} - All found matches
 */
export function getMatchesOfUser(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = ` SELECT * FROM matches WHERE left_player_id = ? OR right_player_id = ?`;
    db.all(sql, [id, id], (err, rows) => {
      if (err) {
        console.error("Error getting matches:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}
