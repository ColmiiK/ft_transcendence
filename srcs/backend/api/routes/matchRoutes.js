import { asyncHandler, validateInput } from "../utils.js";
import {
  createMatch,
  createMatchOffline,
  getMatch,
  finishMatch,
  getMatches,
  getMatchesHistory,
  getMatchesGeneralStats,
  getMatchesType,
  getScheduledMatches,
} from "../models/matchModel.js";

import {
  noMoreMatchesInTournament,
  finishedMatchesInTournament,
  getTournamentByID,
  determineSecondBracket,
  determineFinalStandings,
  finishTournament,
} from "../models/tournamentModel.js";

export default function createMatchRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatches(req.userId);
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/scheduled",
      handler: asyncHandler(async (req, res) => {
        const results = await getScheduledMatches(req.userId);
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/pong",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatchesType(req.userId, "pong");
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/connect",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatchesType(req.userId, "connect_four");
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/history/pong",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatchesHistory(req.userId, "pong");
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/history/connect",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatchesHistory(req.userId, "connect_four");
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/general/pong",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatchesGeneralStats(req.userId, "pong");
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/matches/general/connect",
      handler: asyncHandler(async (req, res) => {
        const results = await getMatchesGeneralStats(
          req.userId,
          "connect_four",
        );
        return res.code(200).send(results);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/matches/offline",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "game_type",
            "custom_mode",
            "rival_alias",
            "first_player_score",
            "second_player_score",
          ])
        )
          return;
        req.body.userId = req.userId;
        if (req.body.first_player_score > req.body.second_player_score) {
          req.body.winner_id = req.body.userId;
          req.body.loser_id = null;
        } else {
          req.body.loser_id = req.body.userId;
          req.body.winner_id = null;
        }
        const match = await createMatchOffline(req.body);
        return res.code(201).send(match);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/matches/online",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "game_type",
            "custom_mode",
            "first_player_id",
            "second_player_id",
          ])
        )
          return;
        const match = await createMatch(req.body);
        return res.code(201).send(match);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/matches/end",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "first_player_score",
            "second_player_score",
            "match_id",
          ])
        )
          return;
        const match = await getMatch(req.body.match_id);
        if (!match) return res.code(400).send({ error: "Match not found" });
        const result = await finishMatch(
          match,
          req.body.first_player_score,
          req.body.second_player_score,
        );
        const tour = await getTournamentByID(match.tournament_id);
        if (tour && (await noMoreMatchesInTournament(tour.tournament_id))) {
          if ((await finishedMatchesInTournament(tour.tournament_id)) === 4) {
            const standings = await determineFinalStandings(tour);
            await finishTournament(tour, standings);
          } else {
            const matches = await determineSecondBracket(tour);
          }
        }
        //TODO: figure out if splitting the endpoint is needed + what to return
        return res.code(200).send(result);
      }),
    },
  ];
}
