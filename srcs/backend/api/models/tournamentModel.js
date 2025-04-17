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

function getParticipantsOfTournament(tournament_id) {
  assert(tournament_id !== undefined, "tournament_id must exist");
  return new Promise((resolve, reject) => {
    const participantsSQL = `
          SELECT
            user_id,
            final_rank
          FROM
            tournament_participants
          WHERE
            tournament_id = ?
        `;
    db.all(participantsSQL, [tournament_id], (err, participants) => {
      if (err) {
        console.error("error getting participants", err.message);
        return reject(err);
      }
      const tournament_participants = participants.map((part) => ({
        user_id: part.user_id,
        final_rank: part.final_rank,
      }));
      resolve(tournament_participants);
    });
  });
}

export function getTournamentByID(id) {
  assert(id !== undefined, "id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        id AS tournament_id,
        name AS tournament_name,
        player_limit,
        status AS tournament_status,
        creator_id,
        created_at,
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
        status: row.status,
        creator_id: row.creator_id,
        created_at: row.created_at,
        started_at: row.started_at,
        finished_at: row.finished_at,
        tournament_invitations: [],
        tournament_participants: [],
      };
      Promise.all([
        getInvitationsOfTournament(id),
        getParticipantsOfTournament(id),
      ]).then(([invitations, participants]) => {
        result.tournament_invitations = invitations;
        result.tournament_participants = participants;
        resolve(result);
      });
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

export function addParticipantToTournament(data, user_id) {
  assert(data !== undefined, "data must exist");
  assert(user_id !== undefined, "user_id must exist");
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO
        tournament_participants (
          tournament_id,
          user_id
        )
      VALUES (?, ?)
    `;
    db.run(sql, [data.tournament_id, user_id], function (err) {
      if (err) {
        console.error("Error inserting tournament participant: ", err.message);
        return reject(err);
      }
      resolve({ success: "invitation confirmed" });
    });
  });
}

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
      resolve(row.status);
    });
  });
}
