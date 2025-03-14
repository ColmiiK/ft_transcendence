import { asyncHandler, validateInput } from "../utils.js";
import {
  createUser,
  getUser,
  getUsers,
  putUser,
  patchUser,
  deleteUser,
  addUserFriend,
  removeUserFriend,
  addUserBlock,
  removeUserBlock,
} from "../models/userModel.js";
import { getMessagesOfUser } from "../models/messageModel.js";
import { getChatsOfUser } from "../models/chatModel.js";
import { getMatchesOfUser } from "../models/matchModel.js";
import { getTournamentsOfUser } from "../models/tournamentModel.js";

export default function createUserRoutes(fastify) {
  return [
    {
      onRequest: [fastify.authenticate],
      method: "GET",
      url: "/users/list",
      handler: asyncHandler(async (req, res) => {
        const users = await getUsers();
        return res.code(200).send(users);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "POST",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["username", "password", "email"])) return;
        const user = await createUser(req.body);
        return res.code(201).send({
          success: true,
          id: user.id,
          username: user.username,
          email: user.email,
          // token: token,
        });
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "GET",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        const user = await getUser(req.userId);
        return res.code(200).send(user);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "PUT",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["username", "password", "email"])) return;
        const user = await putUser(req.userId, req.body);
        return res.code(200).send(user);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "PATCH",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, [])) return;
        const user = await patchUser(req.userId, req.body);
        return res.code(200).send(user);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "DELETE",
      url: "/users",
      handler: asyncHandler(async (req, res) => {
        await deleteUser(req.userId);
        return res.code(204);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "GET",
      url: "/users/:str",
      handler: asyncHandler(async (req, res) => {
        const table = req.params.str;
        var data;
        if (table == "messages") data = await getMessagesOfUser(req.userId);
        else if (table == "chats") data = await getChatsOfUser(req.userId);
        else if (table == "matches") data = await getMatchesOfUser(req.userId);
        else if (table == "tournaments")
          data = await getTournamentsOfUser(req.userId);
        return res.code(200).send(data);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "POST",
      url: "/users/friends",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const data = await addUserFriend(req.userId, req.body.friend_id);
        return res.code(200).send(data);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "PATCH",
      url: "/users/friends",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const data = await removeUserFriend(req.userId, req.body.friend_id);
        return res.code(200).send(data);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "POST",
      url: "/users/blocks",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["blocked_id"])) return;
        const data = await addUserBlock(req.userId, req.body.blocked_id);
        return res.code(200).send(data);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "PATCH",
      url: "/users/blocks",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["blocked_id"])) return;
        const data = await removeUserBlock(req.userId, req.body.blocked_id);
        return res.code(200).send(data);
      }),
    },
  ];
}
