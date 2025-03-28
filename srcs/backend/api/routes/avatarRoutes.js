import { asyncHandler, saveAvatar } from "../utils.js";

export default function createAvatarRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/avatar",
      handler: asyncHandler(async (req, res) => {
        const data = await req.file();
        if (!data) return res.code(400).send({ error: "No file uploaded" });
        const result = await saveAvatar(req.userId, data);
        return res.code(200).send(result);
      }),
    },
  ];
}
