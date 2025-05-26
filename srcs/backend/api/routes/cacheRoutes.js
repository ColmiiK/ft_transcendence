import { asyncHandler, validateInput } from "../utils.js";

export default function createCacheRoutes(fastify) {
  return [
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/gamestate",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["gameId", "state"]))
          return;
        const { gameId, state } = req.body;
        try{
          const timeout = req.body.timeout || 3600;
          await fastify.cache.set(
            `game:${gameId}`,
            JSON.stringify(state),
            timeout,
          )
          return ({ success: true });
        }
        catch(err){
          req.log.error(err);
          return (res.code(500).send({ error: "Faile to save game state" }));
        }
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/gamestate/:id",
      handler: asyncHandler(async (req, res) => {
        const gameId = req.params.id;
        try{
          const result = await fastify.cache.get(`game:${gameId}`);
          if (!result || !result.value)
            return (res.code(404).send({ error: "Game state not found" }));
          return (res.code(200).send({gameId, state: JSON.parse(result.value)}));
        }
        catch(err){
          req.log.error(err);
          return (res.code(500).send({ error: "Failed to retrieve game state" }));
        }
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "DELETE",
      url: "/gamestate/:id",
      handler: asyncHandler(async (req, res) => {
        const gameId = req.params.id;
        try{
          await fastify.cache.del(`game:${gameId}`);
          return ({ success: true });
        }
        catch(err){
          req.log.error(err);
          return (res.code(500).send({ error: "Failed to delete game state" }));
        }
      }),
    },
  ];
}
