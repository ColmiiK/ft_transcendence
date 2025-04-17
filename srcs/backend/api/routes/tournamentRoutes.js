import { asyncHandler, validateInput } from "../utils.js";
import {
  createTournament,
  getTournamentByID,
  addInvitationToTournament,
  modifyInvitationToTournament,
  addParticipantToTournament,
  isInvited,
  isParticipant,
  getInvitationStatus,
  // getTournaments,
  // putTournament,
  // patchTournament,
  // deleteTournament,
} from "../models/tournamentModel.js";

export default function createTournamentRoutes(fastify) {
  return [
    // {
    //   preHandler: [fastify.authenticate],
    //   method: "GET",
    //   url: "/tournaments",
    //   handler: asyncHandler(async (req, res) => {
    //     const tournaments = await getTournaments();
    //     return res.code(200).send(tournaments);
    //   }),
    // },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/tournaments",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["name", "player_limit"])) return;
        const tournament = await createTournament(req.body, req.userId);
        const t_id = tournament.tournament_id;
        await addInvitationToTournament({
          tournament_id: t_id,
          user_id: req.userId,
        });
        await modifyInvitationToTournament(
          {
            status: "confirmed",
            tournament_id: t_id,
          },
          req.userId,
        );
        await addParticipantToTournament(
          {
            tournament_id: t_id,
          },
          req.userId,
        );
        return res.code(201).send(tournament);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/tournaments/:id",
      handler: asyncHandler(async (req, res) => {
        const tournament = await getTournamentByID(req.params.id);
        return res.code(200).send(tournament);
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
          console.log("invStatus:", invStatus);
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
        let result;
        if (await isParticipant(req.body.tournament_id, req.userId))
          return res.code(400).send({
            error: "User is already a participant in the tournament",
          });
        if (req.body.status === "confirmed") {
          if (!(await isInvited(req.body.tournament_id, req.userId)))
            return res
              .code(400)
              .send({ error: "User is not invited to tournament" });
          await modifyInvitationToTournament(req.body, req.userId);
          result = await addParticipantToTournament(req.body, req.userId);
        }
        if (req.body.status === "denied") {
          result = await modifyInvitationToTournament(req.body, req.userId);
        }
        return res.code(200).send(result);
      }),
    },
    //TODO: What happens when the tournament is completed
    //      Start tournament, brackets, matchmaking, etc.
    // {
    //   preHandler: [fastify.authenticate],
    //   method: "PUT",
    //   url: "/tournaments/:id",
    //   handler: asyncHandler(async (req, res) => {
    //     if (!validateInput(req, res, ["name", "player_amount", "player_ids"]))
    //       return;
    //     const tournament = await putTournament(req.params.id, req.body);
    //     return res.code(200).send(tournament);
    //   }),
    // },
    // {
    //   preHandler: [fastify.authenticate],
    //   method: "PATCH",
    //   url: "/tournaments/:id",
    //   handler: asyncHandler(async (req, res) => {
    //     if (!validateInput(req, res, [])) return;
    //     const tournament = await patchTournament(req.params.id, req.body);
    //     return res.code(200).send(tournament);
    //   }),
    // },
    // {
    //   preHandler: [fastify.authenticate],
    //   method: "DELETE",
    //   url: "/tournaments/:id",
    //   handler: asyncHandler(async (req, res) => {
    //     await deleteTournament(req.params.id);
    //     return res.code(204);
    //   }),
    // },
  ];
}
