import { asyncHandler, validateInput } from "../utils.js";
import {
  createChat,
  getChatByID,
  getChats,
  putChat,
  patchChat,
  deleteChat,
  getLastChatsOfUser,
  getChatBetweenUsers,
  isChat,
  getInfoAboutChat,
} from "../models/chatModel.js";

export default function createChatRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/chats",
      handler: asyncHandler(async (req, res) => {
        const chats = await getChats();
        return res.code(200).send(chats);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/chats",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["first_user_id", "second_user_id"]))
          return;
        const chat = await createChat(req.body);
        return res.code(201).send(chat);
      }),
    },
    {
      //TODO: Finish the pagination (make it so it gives the messages in descending order?)
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/chats/:id",
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", default: 1 },
            limit: { type: "integer", default: 20 },
            markAsRead: { type: "boolean", default: true },
          },
        },
      },
      handler: asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, markAsRead = true } = req.query;
        const offset = (page - 1) * limit;
        const chat = await getChatByID(
          req.params.id,
          limit,
          offset,
          markAsRead,
        );
        return res.code(200).send(chat);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/chats/:id",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, [])) return;
        const chat = await patchChat(req.params.id, req.body);
        return res.code(200).send(chat);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "DELETE",
      url: "/chats/:id",
      handler: asyncHandler(async (req, res) => {
        await deleteChat(req.params.id);
        return res.code(204);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/chats/last",
      handler: asyncHandler(async (req, res) => {
        const result = await getLastChatsOfUser(req.userId);
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/chats/identify",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["friend_id"])) return;
        const first_user_id = req.userId;
        const second_user_id = req.body.friend_id;
        if (!(await isChat(first_user_id, second_user_id)))
          await createChat({ first_user_id, second_user_id });
        const result = await getChatBetweenUsers(
          req.userId,
          req.body.friend_id,
        );
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/chats/identify/:id",
      handler: asyncHandler(async (req, res) => {
        const result = await getInfoAboutChat(req.params.id, req.userId);
        return res.code(200).send(result);
      }),
    },
  ];
}
