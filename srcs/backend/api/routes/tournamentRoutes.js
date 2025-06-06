import { asyncHandler, validateInput } from "../utils.js";
import {
  createTournament,
  getTournamentByID,
  findMatchingTournaments,
  getTournaments,
  addInvitationToTournament,
  modifyInvitationToTournament,
  addParticipantToTournament,
  isInvited,
  isParticipant,
  getInvitationStatus,
  isTournamentReady,
  patchTournament,
  determineFirstBracket,
  setTournamentAsStarted,
  getCurrentTournament,
  cancelTournament,
} from "../models/tournamentModel.js";
import { cancelTournamentMatches } from "../models/matchModel.js";
import { getUser } from "../models/userModel.js";

export default function createTournamentRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["name", "game_type", "users"])) return;
        for (let i = 0; i < 4; i++) {
          const user = await getUser(req.body.users[i].username);
          if (user) {
            if (!req.body.users[i].isUser)
              return res.code(400).send({
                error: `Username ${user.username} belongs to an existing user`,
              });
            const currentTournament = await getCurrentTournament(user.id);
            if (currentTournament && currentTournament.is_current)
              return res.code(400).send({
                error: `User ${user.username} is already in a tournament`,
              });
          }
        }
        let tournament = await createTournament(req.body, req.userId);
        for (let i = 0; i < 4; i++) {
          let user = await getUser(req.body.users[i].username);
          if (!user) {
            await addParticipantToTournament({
              tournament_id: tournament.tournament_id,
              user_id: req.userId,
              alias: req.body.users[i].username,
            });
          } else {
            await addParticipantToTournament({
              tournament_id: tournament.tournament_id,
              user_id: user.id,
              alias: user.username,
            });
          }
        }
        tournament = await getTournamentByID(tournament.tournament_id);
        await determineFirstBracket(tournament);
        tournament = await getTournamentByID(tournament.tournament_id);
        return res.code(201).send(tournament);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/tournaments/:id",
      handler: asyncHandler(async (req, res) => {
        const tournament = await getTournamentByID(req.params.id);
        if (!tournament)
          return res.code(400).send({ error: "No tournament found" });
        return res.code(200).send(tournament);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/tournaments/current",
      handler: asyncHandler(async (req, res) => {
        const tournament = await getCurrentTournament(req.userId);
        return res.code(200).send(tournament);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/tournaments/end",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id"])) return;
        const tournament = await getTournamentByID(req.body.tournament_id);
        if (!tournament)
          return res.code(400).send({ error: "Tournament not found" });
        if (tournament.creator_id !== req.userId)
          return res.code(403).send({
            error: "Only the creator of the tournament can cancel it",
          });
        const result = await cancelTournament(
          req.body.tournament_id,
          req.userId,
        );
        await cancelTournamentMatches(tournament);
        return res.code(200).send(result);
      }),
    },
  ];
}
