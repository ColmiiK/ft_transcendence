import { asyncHandler, validateInput } from "../utils.js";
import {
  createUser,
  getUser,
  getUsers,
  putUser,
  patchUser,
  deleteUser,
  findMatchingUsers,
  getProfileOfUser,
} from "../models/userModel.js";
import { getMessagesOfUser } from "../models/messageModel.js";
import { getChatsOfUser } from "../models/chatModel.js";
import { checkCurrentPassword } from "../passwordReset.js";
import { checkNewPassword } from "../passwordReset.js";
import {
  getCurrentTournament,
  cancelTournament,
  getTournamentByID,
} from "../models/tournamentModel.js";
import { cancelTournamentMatches } from "../models/matchModel.js";

export default function createUserRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/users/profile",
      handler: asyncHandler(async (req, res) => {
        const user = await getProfileOfUser(req.userId);
        return res.code(200).send(user);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/users/getid",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["username"])) return;
        const user = await getUser(req.body.username);
        return res.code(200).send({ user_id: user.id });
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/users/password",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "current_password",
            "new_password",
            "new_password_confirm",
          ])
        )
          return;
        if (req.body.new_password !== req.body.new_password_confirm)
          return res.code(403).send({ error: "New passwords don't match" });
        const user = await getUser(req.userId, true);
        const isAuthorized = await checkCurrentPassword(
          user,
          req.body.current_password,
        );
        if (isAuthorized["error"])
          return res.code(403).send({ error: isAuthorized["error"] });
        const samePassword = await checkNewPassword(
          user,
          req.body.new_password,
        );
        if (samePassword)
          return res
            .code(400)
            .send({ error: "New password matches the old one" });
        await patchUser(req.userId, {
          password: req.body.new_password,
        });
        return res.code(200).send({ success: "Password successfully changed" });
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, [])) return;
        const user = await patchUser(req.userId, req.body);
        return res.code(200).send(user);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "DELETE",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["email", "password", "delete_input"]))
          return;
        const user = await getUser(req.body.email, true);
        if (!user) return res.code(400).send({ error: "User does not exist" });
        const isAuthorized = await checkNewPassword(user, req.body.password);
        if (!isAuthorized)
          return res.code(403).send({ error: "Password does not match" });
        if (user.id !== req.userId)
          return res.code(400).send({ error: "Invalid user" });
        let tournament = await getCurrentTournament(req.userId);
        tournament = await getTournamentByID(tournament.id);
        if (tournament) {
          const result = await cancelTournament(
            tournament.tournament_id,
            tournament.creator_id,
          );
          await cancelTournamentMatches(tournament);
        }
        await deleteUser(req.userId);
        return res.code(200).send({ success: "User successfully deleted" });
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/users/search",
      handler: asyncHandler(async (req, res) => {
        const data = await findMatchingUsers(req.body.username, req.userId);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/verify/alias",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["username"])) return;
        const user = await getUser(req.body.username);
        if (user) {
          return res.code(400).send({
            error: `Username ${req.body.username} belongs to an existing user`,
          });
        }
        return res.code(200).send({ success: "Username is free to use" });
      }),
    },
  ];
}
