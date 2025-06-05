import { asyncHandler, validateInput } from "../utils.js";
import {
  createMessage,
  getMessageByID,
  getMessages,
  putMessage,
  patchMessage,
  deleteMessage,
} from "../models/messageModel.js";

export default function createMessageRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/messages",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "sender_id",
            "receiver_id",
            "chat_id",
            "body",
          ])
        )
          return;
        const message = await createMessage(req.body);
        return res.code(201).send(message);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "PATCH",
      url: "/messages/:id",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, [])) return;
        const message = await patchMessage(req.params.id, req.body);
        return res.code(200).send(message);
      }),
    },
  ];
}
