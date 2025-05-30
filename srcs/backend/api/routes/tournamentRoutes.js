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
} from "../models/tournamentModel.js";
import { getUser } from "../models/userModel.js";

export default function createTournamentRoutes(fastify) {
  return [
    // {
    //   preHandler: [fastify.authenticate],
    //   method: "POST",
    //   url: "/tournaments",
    //   handler: asyncHandler(async (req, res) => {
    //     if (!validateInput(req, res, ["name", "player_limit", "game_type"]))
    //       return;
    //     const tournament = await createTournament(req.body, req.userId);
    //     const t_id = tournament.tournament_id;
    //     await addInvitationToTournament({
    //       tournament_id: t_id,
    //       user_id: req.userId,
    //     });
    //     await modifyInvitationToTournament(
    //       {
    //         status: "confirmed",
    //         tournament_id: t_id,
    //       },
    //       req.userId,
    //     );
    //     await addParticipantToTournament(
    //       {
    //         tournament_id: t_id,
    //       },
    //       req.userId,
    //     );
    //     return res.code(201).send(tournament);
    //   }),
    // },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["name", "game_type", "users"])) return;
        for (let i = 0; i < 4; i++) {
          let user = await getUser(req.body.users[i].username);
          if (user) {
            if (!req.body.users[i].isUser)
              return res.code(400).send({
                error: `Username ${user.username} belongs to an existing user`,
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
        console.log("tournament:", tournament);
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
      method: "POST",
      url: "/tournaments/search",
      handler: asyncHandler(async (req, res) => {
        const tournament = await findMatchingTournaments(req.body.name);
        return res.code(200).send(tournament);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/tournaments",
      handler: asyncHandler(async (req, res) => {
        const tournaments = await getTournaments(req.userId);
        return res.code(200).send(tournaments);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments/isinvited",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id", "user_id"])) return;
        const result = await isInvited(
          req.body.tournament_id,
          req.body.user_id,
        );
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments/isparticipant",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id", "user_id"])) return;
        const result = await isParticipant(
          req.body.tournament_id,
          req.body.user_id,
        );
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments/invitationstatus",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id", "user_id"])) return;
        const result = await getInvitationStatus(
          req.body.tournament_id,
          req.body.user_id,
        );
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments/invite",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id", "user_id"])) return;
        if (await isInvited(req.body.tournament_id, req.body.user_id)) {
          const invStatus = await getInvitationStatus(
            req.body.tournament_id,
            req.body.user_id,
          );
          if (invStatus === "denied") {
            const result = await modifyInvitationToTournament(
              {
                tournament_id: req.body.tournament_id,
                status: "pending",
              },
              req.body.user_id,
            );
            return res.code(200).send(result);
          }
          return res.code(400).send({ error: "User is already invited" });
        }
        const result = await addInvitationToTournament(req.body);
        return res.code(201).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/tournaments/invite",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id", "status"])) return;
        const tournament_id = req.body.tournament_id;
        let result;
        if (await isParticipant(tournament_id, req.userId))
          return res.code(400).send({
            error: "User is already a participant in the tournament",
          });
        if (req.body.status === "confirmed") {
          if (!(await isInvited(tournament_id, req.userId)))
            return res
              .code(400)
              .send({ error: "User is not invited to tournament" });
          await modifyInvitationToTournament(req.body, req.userId);
          result = await addParticipantToTournament(req.body, req.userId);
        }
        if (req.body.status === "denied") {
          result = await modifyInvitationToTournament(req.body, req.userId);
        }
        if (await isTournamentReady(tournament_id)) {
          await patchTournament(tournament_id, { status: "ready" });
        }
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments/start",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["tournament_id"])) return;
        const tournament = await getTournamentByID(req.body.tournament_id);
        const tournament_id = tournament.tournament_id;
        if (req.userId !== tournament.creator_id)
          return res
            .code(400)
            .send({ error: "User is not the creator of the tournament" });
        if (tournament.status !== "ready")
          return res.code(400).send({ error: "Tournament is not yet ready" });
        const result = await determineFirstBracket(tournament);
        await setTournamentAsStarted(tournament_id);
        return res.code(200).send(result);
      }),
    },
  ];
}
