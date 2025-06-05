import createUserRoutes from "./userRoutes.js";
import createRelationRoutes from "./relationRoutes.js";
import createMatchRoutes from "./matchRoutes.js";
import createTournamentRoutes from "./tournamentRoutes.js";
import createMessageRoutes from "./messageRoutes.js";
import createChatRoutes from "./chatRoutes.js";
import createAuthRoutes from "./authorizationRoutes.js";
import createAvatarRoutes from "./avatarRoutes.js";
import createWebSocketsRoutes from "../sockets.js";
import assert from "node:assert";

// Bundling all of the routes into one export

export default function createRoutes(fastify) {
  assert(fastify, "Fastify instance is null");
  const userRoutes = createUserRoutes(fastify);
  const relationRoutes = createRelationRoutes(fastify);
  const chatRoutes = createChatRoutes(fastify);
  const messageRoutes = createMessageRoutes(fastify);
  const matchRoutes = createMatchRoutes(fastify);
  const tournamentRoutes = createTournamentRoutes(fastify);
  const authRoutes = createAuthRoutes(fastify);
  const avatarRoutes = createAvatarRoutes(fastify);
  const socketsRoutes = createWebSocketsRoutes(fastify);
  return [].concat(
    userRoutes,
    relationRoutes,
    chatRoutes,
    messageRoutes,
    matchRoutes,
    tournamentRoutes,
    authRoutes,
    avatarRoutes,
    socketsRoutes,
  );
}
