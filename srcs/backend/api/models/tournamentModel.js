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
        id: this.lastID,
        name: data.name,
        player_limit: data.player_limit,
        creator_id: data.creator_id,
      });
    });
  });
}
