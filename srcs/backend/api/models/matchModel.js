import db from "../database.js";
import assert from "node:assert/strict";
import { increaseWins, increaseLosses } from "./userModel.js";

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
        status,
        first_player_id,
        first_player_alias,
        first_player_score,
        second_player_id,
        second_player_alias,
        second_player_score,
        rival_alias,
        winner_id,
        loser_id,
        host,
        is_offline,
        tournament_id,
        played_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, datetime('now', '+2 hours', 'subsec'))
    `;
    const params = [
      data.game,
      data.custom_mode,
      "finished",
      data.first_player_id,
      data.first_player_alias,
      data.first_player_score,
      data.second_player_id,
      data.second_player_alias,
      data.second_player_score,
      data.second_player_alias,
      data.winner_id,
      data.loser_id,
      data.first_player_alias,
      data.is_offline,
      0,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting match:", err.message);
        return reject(err);
      }
      resolve({
        id: this.lastID,
        game: data.game,
        custom_mode: data.custom_mode,
        status: "finished",
        first_player_id: data.first_player_id,
        first_player_alias: data.first_player_alias,
        first_player_score: data.first_player_score,
        second_player_id: data.second_player_id,
        second_player_alias: data.second_player_alias,
        second_player_score: data.second_player_score,
        winner_id: data.winner_id,
        loser_id: data.loser_id,
        first_player_alias: data.first_player_alias,
      });
    });
  });
}

/**
 * Creates an offline match between a user and an invited guest
 * @param {Object} data - All relevant information about the match
 * @returns {Object} - Newly created match
 */
export function createMatchOffline(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO matches (
        game_type,
        custom_mode,
        first_player_id,
        second_player_id,
        first_player_score,
        second_player_score,
        winner_id,
        loser_id,
        rival_alias,
        is_offline,
        status,
        host,
        played_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?, datetime('now', '+2 hours', 'subsec'))
    `;
    const params = [
      data.game_type,
      data.custom_mode,
      data.userId,
      data.userId,
      data.first_player_score,
      data.second_player_score,
      data.winner_id,
      data.loser_id,
      data.rival_alias,
      1,
      "finished",
      data.host,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting match:", err.message);
        return reject(err);
      }
      data.winner_id ? increaseWins(data.userId) : increaseLosses(data.userId);
      resolve({
        match_id: this.lastID,
        game_type: data.game_type,
        custom_mode: data.custom_mode,
        first_player_id: data.userId,
        second_player_id: data.userId,
        first_player_score: data.first_player_score,
        second_player_score: data.second_player_score,
        rival_alias: data.rival_alias,
        host: data.host,
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
        custom_mode,
        first_player_id,
        first_player_alias,
        second_player_id,
        second_player_alias,
        tournament_id,
        phase,
        host
      )
      VALUES (?,?,?,?,?,?,?,?,?)
    `;
    const params = [
      data.game_type,
      data.custom_mode,
      data.first_player_id,
      data.first_player_alias,
      data.second_player_id,
      data.second_player_alias,
      data.tournament_id,
      data.phase,
      data.host,
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
        first_player_alias: data.first_player_alias,
        second_player_id: data.second_player_id,
        second_player_alias: data.second_player_alias,
        tournament_id: data.tournament_id,
        phase: data.phase,
        host: data.host,
      });
    });
  });
}

/**
 * Returns all found scheduled matches of a user
 * @param {Number} user_id - ID of the given user
 * @returns {Array} - All found scheduled matches
 */
export function getScheduledMatches(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        m.id AS match_id,
        m.first_player_id,
        m.second_player_id,
        m.status,
        m.game_type,
        m.custom_mode,
        m.host,
        m.first_player_alias,
        m.second_player_alias,
        u1.avatar AS host_avatar
      FROM
        matches m
      JOIN
        users u1 ON m.first_player_id = u1.id
      JOIN
        users u2 ON m.second_player_id = u2.id
      WHERE
        (m.first_player_id = $user_id OR m.second_player_id = $user_id)
      AND
        m.status = 'scheduled'
      AND
        u1.is_deleted = 0
      AND
        u2.is_deleted = 0
    `;
    db.all(sql, { $user_id: user_id }, function (err, rows) {
      if (err) {
        console.error("Error getting matches:", err.message);
        return reject(err);
      }
      resolve(rows);
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
        m.custom_mode,
        m.is_offline,
        m.rival_alias,
        m.tournament_id,
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
      END AS is_win,
      CASE
        WHEN m.first_player_id = ? THEN u2.username
        ELSE u1.username
      END AS rival_username,
      CASE
        WHEN m.first_player_id = ? THEN u2.id
        ELSE u1.id
      END AS rival_id,
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
      AND
        m.status = 'finished'
      AND
        m.tournament_id = 0
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
        user_id,
        type,
      ],
      function (err, rows) {
        if (err) {
          console.error("Error getting matches:", err.message);
          return reject(err);
        }
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].rival_is_deleted) rows[i].rival_username = "anonymous";
          if (rows[i].is_offline) rows[i].rival_username = rows[i].rival_alias;
          if (rows[i].rival_is_deleted || rows[i].is_offline)
            rows[i].rival_avatar =
              " data:image/webp;base64,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 ";

          delete rows[i].rival_is_deleted;
          delete rows[i].rival_alias;
        }
        resolve(rows);
      },
    );
  });
}

/**
 * Returns general statistics of the selected game type for a given user
 * @param {Number} user_id - ID of the user
 * @param {String} type - Either "pong" or "connect_four"
 * @returns {Object} - General statistics of the game type
 */
export function getMatchesGeneralStats(user_id, type) {
  assert(user_id !== undefined, "user_id must exist");
  assert(type !== undefined, "type must exist");
  return new Promise(async (resolve, reject) => {
    const winsQuery = `
        SELECT COUNT(*) as wins
        FROM matches
        WHERE winner_id = ?
        AND status = 'finished'
        AND game_type = ?
        AND tournament_id = 0
      `;

    const lossesQuery = `
        SELECT COUNT(*) as losses
        FROM matches
        WHERE loser_id = ?
        AND status = 'finished'
        AND game_type = ?
        AND tournament_id = 0
      `;

    const standardGamesQuery = `
        SELECT COUNT(*) as standard_games
        FROM matches
        WHERE (first_player_id = ? OR second_player_id = ?)
        AND custom_mode = 'classic'
        AND status = 'finished'
        AND game_type = ?
        AND tournament_id = 0
      `;

    const customGamesQuery = `
        SELECT COUNT(*) as custom_games
        FROM matches
        WHERE (first_player_id = ? OR second_player_id = ?)
        AND custom_mode != 'classic'
        AND status = 'finished'
        AND game_type = ?
        AND tournament_id = 0
      `;

    const lastTenGamesQuery = `
        SELECT * FROM (
          SELECT
            id,
            first_player_id,
            second_player_id,
            first_player_score,
            second_player_score,
            winner_id,
            played_at
          FROM matches
          WHERE (first_player_id = ? OR second_player_id = ?)
          AND status = 'finished'
          AND game_type = ?
          AND tournament_id = 0
          ORDER BY played_at DESC
          LIMIT 10
        ) AS recent_matches
        ORDER BY played_at ASC
      `;

    const result = {};
    const executeQuery = (sql, params) => {
      return new Promise((innerResolve, innerReject) => {
        db.get(sql, params, (err, row) => {
          if (err) return innerReject(err);
          innerResolve(row);
        });
      });
    };

    const executeAllQuery = (sql, params) => {
      return new Promise((innerResolve, innerReject) => {
        db.all(sql, params, (err, rows) => {
          if (err) return innerReject(err);
          innerResolve(rows);
        });
      });
    };

    const [
      winsResult,
      lossesResult,
      standardGamesResult,
      customGamesResult,
      lastGamesResult,
    ] = await Promise.all([
      executeQuery(winsQuery, [user_id, type]),
      executeQuery(lossesQuery, [user_id, type]),
      executeQuery(standardGamesQuery, [user_id, user_id, type]),
      executeQuery(customGamesQuery, [user_id, user_id, type]),
      executeAllQuery(lastTenGamesQuery, [user_id, user_id, type]),
    ]);
    const last_ten_games = lastGamesResult.map((game) => {
      const isFirstPlayer = game.first_player_id === user_id;
      return {
        id: game.id,
        score: isFirstPlayer
          ? game.first_player_score
          : game.second_player_score,
        opponent_score: isFirstPlayer
          ? game.second_player_score
          : game.first_player_score,
        is_win: game.winner_id === user_id,
      };
    });

    result.wins = winsResult.wins;
    result.losses = lossesResult.losses;
    result.standard_games = standardGamesResult.standard_games;
    result.custom_games = customGamesResult.custom_games;
    result.last_ten_games = last_ten_games;

    resolve(result);
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
        played_at = datetime('now', '+2 hours', 'subsec')
      WHERE
        id = ?
    `;
    let winner_id;
    let loser_id;
    if (first_player_score > second_player_score) {
      winner_id = match.first_player_id;
      if (match.first_player_id !== match.second_player_id)
        loser_id = match.second_player_id;
      else loser_id = null;
    } else {
      if (match.first_player_id !== match.second_player_id)
        winner_id = match.second_player_id;
      else winner_id = null;
      loser_id = match.first_player_id;
    }
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
      if (winner_id) increaseWins(winner_id);
      if (loser_id) increaseLosses(loser_id);
      resolve({ success: "Match successfully finished" });
    });
  });
}

export async function patchMatch(id, updates) {
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
        console.error("Error updating matches:", err.message);
        return reject(err);
      }
      if (this.changes === 0) return resolve({ message: "No changes" });
      resolve({ success: true, id, ...updates });
    });
  });
}

export function cancelTournamentMatches(tournament) {
  assert(tournament !== undefined, "tournament must exist");
  tournament.tournament_matches.forEach((match) => {
    if (match.match_status === "scheduled")
      patchMatch(match.match_id, { status: "cancelled" });
  });
}

/**
 * Returns true or false if the match is in a tournament
 * @param {Number} match_id - ID of the match
 * @returns {Boolean} - True or false if it is in a tournament, null if there is no match
 */
export function getMatchInTournament(match_id) {
  assert(match_id !== undefined, "match_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        tournament_id
      FROM
        matches
      WHERE
        id = $match_id
    `;
    db.get(sql, { $match_id: match_id }, function (err, row) {
      if (err) {
        console.error("Error getting matches:", err.message);
        return reject(err);
      }
      if (!row) return resolve(null);
      resolve(row.tournament_id !== null);
    });
  });
}
