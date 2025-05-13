import db from "../database.js";
import assert from "node:assert/strict";

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
        first_player_id,
        second_player_id
      )
      VALUES (?,?,?)
    `;
    const params = [
      data.game_type,
      data.first_player_id,
      data.second_player_id,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting match:", err.message);
        return reject(err);
      }
      resolve({
        match_id: this.lastID,
        game_type: data.game_type,
        first_player_id: data.first_player_id,
        second_player_id: data.second_player_id,
      });
    });
  });
}

/**
 * Schedules a match
 * @param {Object} data - Payload
 * @returns {Object} - Newly scheduled match
 */
export function scheduleMatch(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO matches (
        game_type,
        first_player_id,
        second_player_id,
        tournament_id,
        phase
      )
      VALUES (?,?,?,?,?)
    `;
    const params = [
      data.game_type,
      data.first_player_id,
      data.second_player_id,
      data.tournament_id,
      data.phase,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting match:", err.message);
        return reject(err);
      }
      resolve({
        match_id: this.lastID,
        game_type: data.game_type,
        first_player_id: data.first_player_id,
        second_player_id: data.second_player_id,
        tournament_id: data.tournament_id,
        phase: data.phase,
      });
    });
  });
}

/**
 * Returns a match by a given ID
 * @param {Number} match_id - ID of the match
 * @returns {Object} - Found match
 */
export function getMatch(match_id) {
  assert(match_id !== undefined, "match_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        *
      FROM
        matches
      WHERE
        id = ?
    `;
    db.get(sql, [match_id], function (err, row) {
      if (err) {
        console.error("Error getting match:", err.message);
        return reject(err);
      }
      resolve(row);
    });
  });
}

/**
 * Returns all matches of a given user
 * @param {Number} user_id - ID of the user
 * @returns {Object} - All found matches
 */
export function getMatches(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        *
      FROM
        matches
      WHERE
        first_player_id = ? OR second_player_id = ?
    `;
    db.all(sql, [user_id, user_id], function (err, rows) {
      if (err) {
        console.error("Error getting match:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Returns all matches from a given type of game for a user
 * @param {Number} user_id - ID of the user
 * @param {String} type - Either "pong" or "connect_four"
 * @returns {Array} - All found matches of the given type
 */
export function getMatchesType(user_id, type) {
  assert(user_id !== undefined, "user_id must exist");
  assert(type !== undefined, "type must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        *
      FROM
        matches
      WHERE
        game_type = ?
      AND
        (first_player_id = ? OR second_player_id = ?)
    `;
    db.all(sql, [type, user_id, user_id], function (err, rows) {
      if (err) {
        console.error("Error getting matche:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Returns all matches as the history of matches
 * @param {Number} user_id - ID of the user
 * @param {String} type - Either "pong" or "connect_four"
 * @returns {Array} - All found matches of the given type
 */
export function getMatchesHistory(user_id, type) {
  assert(user_id !== undefined, "user_id must exist");
  assert(type !== undefined, "type must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        m.id AS match_id,
        m.game_type,
        m.played_at,
      CASE
        WHEN m.first_player_id = ? THEN m.first_player_score
        ELSE m.second_player_score
      END AS user_score,
      CASE
        WHEN m.first_player_id = ? THEN m.second_player_score
        ELSE m.first_player_score
      END AS rival_score,
      CASE
        WHEN m.winner_id = ? THEN TRUE
        ELSE FALSE
      END AS won,
      CASE
        WHEN m.first_player_id = ? THEN u2.username
        ELSE u1.username
      END AS rival_username,
      CASE
        WHEN m.first_player_id = ? THEN u2.is_deleted
        ELSE u1.is_deleted
      END AS rival_is_deleted,
      CASE
        WHEN m.first_player_id = ? THEN u2.avatar
        ELSE u1.avatar
      END AS rival_avatar
      FROM
        matches m
      JOIN
        users u1 ON m.first_player_id = u1.id
      JOIN
        users u2 ON m.second_player_id = u2.id
      WHERE
        (m.first_player_id = ? OR m.second_player_id = ?)
      AND
        m.game_type = ?
      ORDER BY
        m.played_at DESC;
    `;
    db.all(
      sql,
      [
        user_id,
        user_id,
        user_id,
        user_id,
        user_id,
        user_id,
        user_id,
        user_id,
        type,
      ],
      function (err, rows) {
        if (err) {
          console.error("Error getting matche:", err.message);
          return reject(err);
        }
        // TODO: ADD ANONYMOUS AVATAR
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].rival_is_deleted) {
            rows[i].rival_username = "anonymous";
          }
          delete rows[i].rival_is_deleted;
        }
        resolve(rows);
      },
    );
  });
}

/**
 * Finishes a match
 * @param {Object} match - Given match
 * @param {Number} first_player_score - Score of the first player
 * @param {Number} second_player_score - Score of the second player
 * @returns {Object} - Success message
 */
export function finishMatch(match, first_player_score, second_player_score) {
  assert(match !== undefined, "match must exist");
  assert(first_player_score !== undefined, "first_player_score must exist");
  assert(second_player_score !== undefined, "second_player_score must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE
        matches
      SET
        first_player_score = ?,
        second_player_score = ?,
        winner_id = ?,
        loser_id = ?,
        status = 'finished',
        played_at = datetime('now', '+2 hours')
      WHERE
        id = ?
    `;
    const winner_id =
      first_player_score > second_player_score
        ? match.first_player_id
        : match.second_player_id;
    const loser_id =
      first_player_score < second_player_score
        ? match.first_player_id
        : match.second_player_id;
    const params = [
      first_player_score,
      second_player_score,
      winner_id,
      loser_id,
      match.id,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating match:", err.message);
        return reject(err);
      }
      resolve({ success: "Match successfully finished" });
    });
  });
}
