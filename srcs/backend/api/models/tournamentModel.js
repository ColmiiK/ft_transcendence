import db from "../database.js";
import assert from "node:assert/strict";
import { scheduleMatch } from "./matchModel.js";

/**
 * Creates a tournament
 * @param {Object} data - Name, player amount and IDs of the players
 * @param {Number} creatorId - ID of the creator
 * @returns {Object} - Newly created tournament
 */
export function createTournament(data, creatorId) {
  assert(data !== undefined, "data must exist");
  assert(creatorId !== undefined, "creatorId must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO
        tournaments (
          name,
          game_type,
          creator_id
        )
      VALUES (?,?,?)
    `;
    const params = [data.name, data.game_type, creatorId];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting tournament:", err.message);
        return reject(err);
      }
      resolve({
        tournament_id: this.lastID,
        tournament_name: data.name,
        game_type: data.game_type,
        creator_id: creatorId,
      });
    });
  });
}

/**
 * Helper function to get all invitations of a tournament
 * @param {Number} tournament_id - ID of the tournament
 * @returns {Object} - Invitations of the tournament
 */
function getInvitationsOfTournament(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const invitationsSQL = `
        SELECT
          user_id,
          status AS invitation_status,
          invited_at
        FROM
          tournament_invitations
        WHERE
          tournament_id = ?
       `;
    db.all(invitationsSQL, [tournament_id], (err, invitations) => {
      if (err) {
        console.error("error getting invitations", err.message);
        return reject(err);
      }
      const tournament_invitations = invitations.map((inv) => ({
        user_id: inv.user_id,
        status: inv.invitation_status,
      }));
      resolve(tournament_invitations);
    });
  });
}

/**
 * Helper function to get all participants of a tournament
 * @param {Number} tournament_id - ID of the tournament
 * @returns {Object} - Participants of the tournament
 */
function getParticipantsOfTournament(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const participantsSQL = `
          SELECT
            user_id,
            final_rank,
            alias
          FROM
            tournament_participants
          WHERE
            tournament_id = ?
          ORDER BY
            final_rank
        `;
    db.all(participantsSQL, [tournament_id], (err, participants) => {
      if (err) {
        console.error("error getting participants", err.message);
        return reject(err);
      }
      const tournament_participants = participants.map((part) => ({
        user_id: part.user_id,
        final_rank: part.final_rank,
        alias: part.alias,
      }));
      resolve(tournament_participants);
    });
  });
}

/**
 * Helper function to get all matches of a tournament
 * @param {Number} tournament_id - ID of the tournament
 * @returns {Object} - Matches of the tournament
 */
function getMatchesOfTournament(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const matchesSQL = `
          SELECT
            id AS match_id,
            status AS match_status,
            phase,
            first_player_id,
            second_player_id,
            first_player_alias,
            second_player_alias,
            first_player_score,
            second_player_score,
            winner_id,
            loser_id,
            played_at
          FROM
            matches
          WHERE
            tournament_id = ?
        `;
    db.all(matchesSQL, [tournament_id], (err, matches) => {
      if (err) {
        console.error("error getting matches", err.message);
        return reject(err);
      }
      const tournament_matches = matches.map((m) => ({
        match_id: m.match_id,
        match_status: m.match_status,
        match_phase: m.phase,
        first_player_id: m.first_player_id,
        second_player_id: m.second_player_id,
        first_player_alias: m.first_player_alias,
        second_player_alias: m.second_player_alias,
        first_player_score: m.first_player_score,
        second_player_score: m.second_player_score,
        winner_id: m.winner_id,
        loser_id: m.loser_id,
        played_at: m.played_at,
      }));
      resolve(tournament_matches);
    });
  });
}

/**
 * Finds all matching tournaments that start with a given name
 * @param {String} name - Name of the tournament
 * @returns {Array} - All matching tournaments
 */
export function findMatchingTournaments(name) {
  assert(name !== undefined, "name must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        id,
        name,
        game_type,
        status
      FROM
        tournaments
      WHERE
        name LIKE ?
`;
    db.all(sql, [name + "%"], function (err, rows) {
      if (err) {
        console.error("error getting tournaments", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Returns all information about a tournament
 * @param {Number} id - ID of the tournament
 * @returns {Object} - Tournament with invitations, participants and matches
 */
export function getTournamentByID(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        id AS tournament_id,
        name AS tournament_name,
        player_limit,
        status AS tournament_status,
        game_type,
        creator_id,
        started_at,
        finished_at
      FROM
        tournaments
      WHERE id = ?
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error("error getting tournament", err.message);
        return reject(err);
      }
      if (!row) return resolve(null);
      const result = {
        tournament_id: row.tournament_id,
        name: row.tournament_name,
        player_limit: row.player_limit,
        status: row.tournament_status,
        game_type: row.game_type,
        creator_id: row.creator_id,
        started_at: row.started_at,
        finished_at: row.finished_at,
        tournament_participants: [],
        tournament_matches: [],
      };
      Promise.all([
        getParticipantsOfTournament(id),
        getMatchesOfTournament(id),
      ]).then(([participants, matches]) => {
        result.tournament_participants = participants;
        result.tournament_matches = matches;
        resolve(result);
      });
    });
  });
}

/**
 * Returns all tournaments where the user plays
 * @param {Number} user_id - ID of the user
 * @returns {Object} - Tournaments where the user participates
 */
export function getTournaments(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        t.id,
        t.name,
        t.status,
        t.game_type,
        t.created_at,
        t.started_at,
        t.finished_at,
        tp.final_rank
      FROM
        tournaments t
      JOIN
        tournament_participants tp
          ON
            t.id = tp.tournament_id
      WHERE
        tp.user_id = ?
    `;
    db.all(sql, [user_id], function (err, rows) {
      if (err) {
        console.error("Error getting tournaments: ", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Invites a user to a tournament
 * @param {Object} data - Tournament and user payload
 * @returns {Object} - Newly created invitation
 */
export function addInvitationToTournament(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO
        tournament_invitations (
          tournament_id,
          user_id
        )
      VALUES (?, ?)
    `;
    db.run(sql, [data.tournament_id, data.user_id], function (err) {
      if (err) {
        console.error("Error inserting tournament invitation: ", err.message);
        return reject(err);
      }
      resolve({
        invitation_id: this.lastID,
        user_id: data.user_id,
        status: this.status,
        invited_at: this.invited_at,
      });
    });
  });
}

/**
 * Modifies an invitation of a tournament
 * @param {Object} data - Payload of the tournament
 * @param {Number} user_id - ID of the user
 * @returns {Object} - Success message
 */
export function modifyInvitationToTournament(data, user_id) {
  assert(data !== undefined, "data must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE
        tournament_invitations
      SET
        status = ?
      WHERE
        tournament_id = ?
      AND
        user_id = ?
    `;
    db.run(sql, [data.status, data.tournament_id, user_id], function (err) {
      if (err) {
        console.error("Error inserting tournament invitation: ", err.message);
        return reject(err);
      }
      resolve({ success: "invitation modified successfully" });
    });
  });
}

/**
 * Adds a participant to a tournament
 * @param {Object} data - Payload of the tournament
 * @returns {Object} - Success message
 */
export function addParticipantToTournament(data) {
  assert(data !== undefined, "data must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO
        tournament_participants (
          tournament_id,
          user_id,
          alias
        )
      VALUES (?, ?, ?)
    `;
    db.run(sql, [data.tournament_id, data.user_id, data.alias], function (err) {
      if (err) {
        console.error("Error inserting tournament participant: ", err.message);
        return reject(err);
      }
      resolve({ success: "Participant added to tournament" });
    });
  });
}

/**
 * Checks if a given user is invited to a tournament
 * @param {Number} tournament_id - ID of the tournament
 * @param {Number} user_id - ID of the user
 * @returns {Boolean} - User is invited
 */
export function isInvited(tournament_id, user_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM
          tournament_invitations
        WHERE
          user_id = ? AND tournament_id = ?)
      AS is_invited;`;
    const params = [user_id, tournament_id];
    db.get(sql, params, function (err, row) {
      if (err) {
        console.error("Error accessing tournament_invitations:", err.message);
        return reject(err);
      }
      resolve(row.is_invited === 1);
    });
  });
}

/**
 * Checks if a given user is a participant to a tournament
 * @param {Number} tournament_id - ID of the tournament
 * @param {Number} user_id - ID of the user
 * @returns {Boolean} - User is participant
 */
export function isParticipant(tournament_id, user_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT EXISTS (
        SELECT 1
        FROM
          tournament_participants
        WHERE
          user_id = ? AND tournament_id = ?)
      AS is_participant;`;
    const params = [user_id, tournament_id];
    db.get(sql, params, function (err, row) {
      if (err) {
        console.error("Error accessing tournament_participants:", err.message);
        return reject(err);
      }
      resolve(row.is_participant === 1);
    });
  });
}

/**
 * Checks the current status of an invitation
 * @param {Number} tournament_id - ID of the tournament
 * @param {Number} user_id - ID of the user
 * @returns {Object} - Status of the invitation
 */
export function getInvitationStatus(tournament_id, user_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        status
      FROM
        tournament_invitations
      WHERE
        user_id = ? AND tournament_id = ?
      `;
    const params = [user_id, tournament_id];
    db.get(sql, params, function (err, row) {
      if (err) {
        console.error("Error accessing tournament_participants:", err.message);
        return reject(err);
      }
      if (!row) return resolve(null);
      resolve(row);
    });
  });
}

/**
 * Checks if the maximum amount of players has been reached
 * @param {Number} tournament_id - ID of the tournament
 * @returns {Boolean} - true if the number of participants is the maximum,
 *                      false if it isn't
 */
export function isTournamentReady(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(user_id) AS count
      FROM
        tournament_participants
      WHERE
        tournament_id = ?
    `;
    db.get(sql, [tournament_id], function (err, row) {
      if (err) {
        console.error("Error accessing tournament_participants:", err.message);
        return reject(err);
      }
      resolve(row.count === 4);
    });
  });
}

/**
 * Patches a tournament
 * @param {Number} id - ID of the tournament
 * @param {Object} updates - Updatable fields
 * @returns {Object} - Updated fields
 */
export function patchTournament(id, updates) {
  assert(id !== undefined, "id must exist");
  assert(updates !== undefined, "updates must exist");
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const params = Object.values(updates);
    params.push(id);
    const sql = `
      UPDATE tournaments
      SET ${fields}
      WHERE id = ?
    `;
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating tournaments:", err.message);
        return reject(err);
      }
      resolve({ success: true, id, ...updates });
    });
  });
}

/**
 * Sets the tournament as 'in_progress', setting the datetime
 * @param {Number} id - ID of the tournament
 * @returns {Object} - Success message
 */
export function setTournamentAsStarted(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE
        tournaments
      SET
        status = 'in_progress',
        started_at = datetime('now', '+2 hours')
      WHERE
        id = ?
    `;
    db.run(sql, [id], function (err) {
      if (err) {
        console.error("Error updating tournament:", err.message);
        return reject(err);
      }
      resolve({ success: "Tournament successfully started" });
    });
  });
}

/**
 * Sets the tournament as 'finished', setting the datetime
 * @param {Number} id - ID of the tournament
 * @returns {Object} - Success message
 */
export function setTournamentAsFinished(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE
        tournaments
      SET
        status = 'finished',
        finished_at = datetime('now', '+2 hours')
      WHERE
        id = ?
    `;
    db.run(sql, [id], function (err) {
      if (err) {
        console.error("Error updating tournament:", err.message);
        return reject(err);
      }
      resolve({ success: "Tournament successfully finished" });
    });
  });
}

/**
 * Schedules the first bracket of matches (semi-finals) through random matchmaking
 * @param {Object} tournament - Tournament in question
 * @returns {Object} - Newly scheduled matches
 */
export async function determineFirstBracket(tournament) {
  assert(tournament !== undefined, "tournament must exist");
  const participants = tournament.tournament_participants.map(
    ({ user_id, alias }) => ({
      user_id,
      alias,
    }),
  );
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  const [custom_mode, game_type] = tournament.game_type.split("-");
  const matches = await Promise.all([
    scheduleMatch({
      game_type: game_type,
      custom_mode: custom_mode,
      first_player_id: participants[0].user_id,
      first_player_alias: participants[0].alias,
      second_player_id: participants[1].user_id,
      second_player_alias: participants[1].alias,
      tournament_id: tournament.tournament_id,
      phase: "semifinals",
    }),
    scheduleMatch({
      game_type: game_type,
      custom_mode: custom_mode,
      first_player_id: participants[2].user_id,
      first_player_alias: participants[2].alias,
      second_player_id: participants[3].user_id,
      second_player_alias: participants[3].alias,
      tournament_id: tournament.tournament_id,
      phase: "semifinals",
    }),
  ]);
  return matches;
}

/**
 * Schedules the second bracket (tiebreaker and finals)
 * @param {Object} tournament - Tournament in question
 * @returns {Object} - Newly scheduled matches
 */
export async function determineSecondBracket(tournament) {
  assert(tournament !== undefined, "tournament must exist");
  const winners = [];
  const losers = [];
  for (let i = 0; i < 2; i++) {
    winners.push({
      id: tournament.tournament_matches[i].winner_id,
      alias:
        tournament.tournament_matches[i].first_player_score >
        tournament.tournament_matches[i].second_player_score
          ? tournament.tournament_matches[i].first_player_alias
          : tournament.tournament_matches[i].second_player_alias,
    });
    losers.push({
      id: tournament.tournament_matches[i].loser_id,
      alias:
        tournament.tournament_matches[i].first_player_score <
        tournament.tournament_matches[i].second_player_score
          ? tournament.tournament_matches[i].first_player_alias
          : tournament.tournament_matches[i].second_player_alias,
    });
  }
  const [custom_mode, game_type] = tournament.game_type.split("-");
  const matches = await Promise.all([
    scheduleMatch({
      game_type: game_type,
      custom_mode: custom_mode,
      first_player_id: winners[0].id,
      first_player_alias: winners[0].alias,
      second_player_id: winners[1].id,
      second_player_alias: winners[1].alias,
      tournament_id: tournament.tournament_id,
      phase: "finals",
    }),
    scheduleMatch({
      game_type: game_type,
      custom_mode: custom_mode,
      first_player_id: losers[0].id,
      first_player_alias: losers[0].alias,
      second_player_id: losers[1].id,
      second_player_alias: losers[1].alias,
      tournament_id: tournament.tournament_id,
      phase: "tiebreaker",
    }),
  ]);
  return matches;
}

/**
 * Returns the standings after the tournament is over
 * @param {Object} tournament - Tournament in question
 * @returns {Object} - Final standings
 */
export async function determineFinalStandings(tournament) {
  const standings = [];
  tournament.tournament_matches.forEach((match) => {
    if (match.match_phase === "finals") {
      standings.push({
        position: 1,
        id: match.winner_id,
        alias:
          match.first_player_score > match.second_player_score
            ? match.first_player_alias
            : match.second_player_alias,
      });
      standings.push({
        position: 2,
        id: match.loser_id,
        alias:
          match.first_player_score < match.second_player_score
            ? match.first_player_alias
            : match.second_player_alias,
      });
    }
    if (match.match_phase === "tiebreaker") {
      standings.push({
        position: 3,
        id: match.winner_id,
        alias:
          match.first_player_score > match.second_player_score
            ? match.first_player_alias
            : match.second_player_alias,
      });
      standings.push({
        position: 4,
        id: match.loser_id,

        alias:
          match.first_player_score < match.second_player_score
            ? match.first_player_alias
            : match.second_player_alias,
      });
    }
  });
  return standings;
}

/**
 * Checks if all avaliable matches of a tournament are finished
 * @param {Number} tournament_id - ID of the tournament
 * @returns {Boolean} - true if no more matches are remaining,
 *                      false otherwise
 */
export async function noMoreMatchesInTournament(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        COUNT(id) AS count
      FROM
        matches
      WHERE
        tournament_id = ?
      AND
        status != 'finished'
    `;
    db.get(sql, [tournament_id], function (err, row) {
      if (err) {
        console.error("Error accessing matches:", err.message);
        return reject(err);
      }
      resolve(row.count === 0);
    });
  });
}

/**
 * Returns the amount of finished matches of a tournament
 * @param {Nubmer} tournament_id - ID of the tournament
 * @returns {Number} - Amount of finished matches
 */
export async function finishedMatchesInTournament(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        COUNT(id) AS count
      FROM
        matches
      WHERE
        tournament_id = ?
      AND
        status = 'finished'
    `;
    db.get(sql, [tournament_id], function (err, row) {
      if (err) {
        console.error("Error accessing matches:", err.message);
        return reject(err);
      }
      resolve(row.count);
    });
  });
}

/**
 * Patches the participants table
 * @param {String} user_alias - Alias of the user
 * @param {Number} tournament_id - ID of the tournament
 * @param {Object} updates - Updatable fields
 * @returns {Object} - Updated fields
 */
export async function patchParticipants(user_alias, tournament_id, updates) {
  assert(user_alias !== undefined, "user_alias must exist");
  assert(tournament_id !== undefined, "tournament_id must exist");
  assert(updates !== undefined, "updates must exist");
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const params = Object.values(updates);
    params.push(user_alias, tournament_id);
    const sql = `
      UPDATE tournament_participants
      SET ${fields}
      WHERE alias = ? AND tournament_id = ?
    `;
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error updating tournament_participants:", err.message);
        return reject(err);
      }
      resolve({ success: true, ...updates });
    });
  });
}

/**
 * Sets the tournament as finished, modifying both the tournament and participants
 * @param {Object} tournament - Tournament in question
 * @param {Object} standings - Final standings
 */
export async function finishTournament(tournament, standings) {
  assert(tournament !== undefined, "tournament must exist");
  assert(standings !== undefined, "standings must exist");
  await Promise.all([
    standings.map(async (stand) => {
      return await patchParticipants(stand.alias, tournament.tournament_id, {
        final_rank: stand.position,
      });
    }),
  ]);
  await setTournamentAsFinished(tournament.tournament_id);
}

/**
 * Returns the current tournament for a given user
 * @param {Number} user_id - ID of the given user
 * @returns {Object} - The current tournament, if it exists
 */
export function getCurrentTournament(user_id) {
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        t.name,
        t.id,
        t.game_type,
        t.status
      FROM
        tournaments t
      JOIN
        tournament_participants tp ON t.id = tp.tournament_id
      WHERE
        t.status != 'finished'
      AND
        tp.user_id = $user_id
    `;
    db.get(sql, { $user_id: user_id }, function (err, row) {
      if (err) {
        console.error("Error getting tournament", err.message);
        return reject(err);
      }
      if (!row) resolve(null);
      resolve(row);
    });
  });
}
