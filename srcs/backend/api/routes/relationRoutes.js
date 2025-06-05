import { asyncHandler, validateInput } from "../utils.js";
import {
  removeUserFriend,
  addUserBlock,
  removeUserBlock,
  addUserFriendPending,
  acceptUserFriend,
  getUserFriends,
  getFriendOfUser,
  getInvitationsOfUser,
  getBlocks,
  isFriend,
} from "../models/userModel.js";

export default function createRelationRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/users/friends",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const data = await addUserFriendPending(req.userId, req.body.friend_id);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/users/friends/confirm",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const data = await acceptUserFriend(req.userId, req.body.friend_id);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/users/friends",
      handler: asyncHandler(async (req, res) => {
        const data = await getUserFriends(req.userId);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/users/friends/:id",
      handler: asyncHandler(async (req, res) => {
        if (!(await isFriend(req.userId, req.params.id)))
          return res.code(403).send({ error: "Users are not friends" });
        const data = await getFriendOfUser(req.params.id);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/users/isfriends",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const data = await isFriend(req.userId, req.body.friend_id);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/users/friends",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const data = await removeUserFriend(req.userId, req.body.friend_id);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/users/invitations",
      handler: asyncHandler(async (req, res) => {
        const data = await getInvitationsOfUser(req.userId);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/users/blocks",
      handler: asyncHandler(async (req, res) => {
        const result = await getBlocks(req.userId);
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/users/blocks",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["blocked_id"])) return;
        if (await isFriend(req.userId, req.body.blocked_id))
          await removeUserFriend(req.userId, req.body.blocked_id);
        const data = await addUserBlock(req.userId, req.body.blocked_id);
        return res.code(200).send(data);
      }),
    },
    {
      preHandler: [fastify.authenticate],
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
