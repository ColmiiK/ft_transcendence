import db from "../database.js";
import assert from "node:assert/strict";

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
          player_limit,
          creator_id
        )
      VALUES (?, ?, ?)
    `;
    const params = [data.name, data.player_limit, creatorId];
    db.run(sql, params, function (err) {
      if (err) {
        console.error("Error inserting tournament:", err.message);
        return reject(err);
      }
      resolve({
        tournament_id: this.lastID,
        tournament_name: data.name,
        player_limit: data.player_limit,
        creator_id: data.creator_id,
      });
    });
  });
}

export function getTournamentByID(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        t.id AS tournament_id,
        t.name AS tournament_name,
        t.player_limit,
        t.status AS tournament_status,
        t.creator_id,
        t.created_at,
        t.started_at,
        t.finished_at,
        ti.user_id AS invited_user_id,
        ti.status AS invitation_status,
        ti.invited_at,
        tp.user_id AS participant_user_id,
        tp.final_rank
      FROM
        tournaments t
      LEFT JOIN
        tournament_players tp ON (t.id = tp.tournament_id)
      LEFT JOIN
        tournament_invitations ti ON (t.id = ti.tournament_id)
      WHERE t.id = ?
    `;
    db.all(sql, [id], (err, rows) => {
      if (err) {
        console.error("error getting tournament", err.message);
        return reject(err);
      }
      const result = {
        tournament_id: rows[0].tournament_id,
        name: rows[0].tournament_name,
        player_limit: rows[0].player_limit,
        status: rows[0].status,
        creator_id: rows[0].creator_id,
        created_at: rows[0].created_at,
        started_at: rows[0].started_at,
        finished_at: rows[0].finished_at,
        tournament_invitations: [],
        tournament_players: [], //FIX: Finish confirmation before
      };
      rows.forEach((row) => {
        result.tournament_invitations.push({
          user_id: row.invited_user_id,
          status: row.invitation_status,
        });
        //FIX: works?
        result.tournament_players.push({
          user_id: row.participant_user_id,
          final_rank: row.final_rank,
        });
      });
      resolve(result);
    });
  });
}

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
