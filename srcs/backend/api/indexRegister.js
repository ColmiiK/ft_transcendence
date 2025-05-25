import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import formbody from "@fastify/formbody";
import websocket from "@fastify/websocket";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastifyCaching from "@fastify/caching";
import abstractCache from "abstract-cache";
import { UPLOAD_DIR } from "./utils.js";

export default async function pluginRegistration(fastify) {
  /** Plugin registration */
  await fastify.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/([\w\d]+)\.42malaga\.com(:\d+)?$/,
        /^https?:\/\/10\.13\.\d{1,3}\.\d{1,3}(:\d+)?$/,
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
  await fastify.register(fastifyStatic, {
    root: UPLOAD_DIR,
    prefix: "/avatars/",
  });

  const cache = abstractCache({ useAwait: true });
  await fastify.register(fastifyCaching, {
    cache: cache,
    expiresIn: 3600,
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
      return res.code(401).send({ error: "Signed cookie must be provided" });
    }
  });
}
