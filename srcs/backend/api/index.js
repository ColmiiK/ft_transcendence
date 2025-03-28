import Fastify from "fastify";
import createRoutes from "./routes/routes.js";
import pluginRegistration from "./indexRegister.js";

const fastify = Fastify({
  logger: {
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
        colorize: true,
        singleLine: true,
      },
    },
  },
});

await pluginRegistration(fastify);

//zod comentar para ver la libreria
const { ADDRESS = "0.0.0.0", PORT = "9000" } = process.env;

/** Declares the routes */
fastify.get("/", async function handler(request, reply) {
  return { hello: "world" };
});

const routes = createRoutes(fastify);
routes.forEach((route) => {
  fastify.route(route);
});

try {
  await fastify.listen({ host: ADDRESS, port: PORT });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export default fastify;
