import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import createRoutes from "./routes/routes.js";
// NODEMAILER for sending emails

const fastify = Fastify({ logger: true });
await fastify.register(cors, {});
fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  sign: {
    expiresIn: "1d",
  },
});
fastify.decorate("authenticate", async function (req, res) {
  try {
    await req.jwtVerify();
  } catch (err) {
    res.send(err);
  }
});

const { ADDRESS = "0.0.0.0", PORT = "9000" } = process.env;

// Declare a route
fastify.get("/", async function handler(request, reply) {
  return { hello: "world" };
});

const routes = createRoutes(fastify);

routes.forEach((route) => {
  fastify.route(route);
});

// Run the server!
try {
  await fastify.listen({ host: ADDRESS, port: PORT });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export default fastify;
