import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import formbody from "@fastify/formbody";
import websocket from "@fastify/websocket";
import fastifyCookie from "@fastify/cookie";

export default async function pluginRegistration(fastify) {
  /** Plugin registration */
  await fastify.register(cors, {
    // origin: "http://localhost:8000",
    origin: (origin, cb) => {
      const allowedOrigins = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/([\w\d]+)\.42malaga\.com(:\d+)?$/,
      ];
      if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
  });
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: {
      expiresIn: "1d",
    },
  });
  await fastify.register(multipart);
  await fastify.register(formbody);
  await fastify.register(websocket);
  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
    hook: "preValidation",
  });

  /** Decorator for Cookie / JWT verification */
  fastify.decorate("authenticate", async function (req, res) {
    try {
      const { valid, value } = req.unsignCookie(req.cookies.token);
      if (!valid)
        return res.code(401).send({ error: "Invalid cookie signature" });
      const decoded = fastify.jwt.verify(value);
      req.userId = decoded.user;
    } catch (err) {
      res.send(err);
    }
  });
}
