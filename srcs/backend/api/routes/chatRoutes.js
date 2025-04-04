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
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/chats/:id",
      handler: asyncHandler(async (req, res) => {
        const chat = await getChatByID(req.params.id);
        return res.code(200).send(chat);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PUT",
      url: "/chats/:id",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["first_user_id", "second_user_id"]))
          return;
        const chat = await putChat(req.params.id, req.body);
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
        // if (!isChat(first_user_id, second_user_id))
        // {
          console.log("There is no chat");
          await createChat({first_user_id, second_user_id});
        // }
        const result = await getChatBetweenUsers(
          req.userId,
          req.body.friend_id,
        );
        return res.code(200).send(result);
      }),
    },
  ];
}
