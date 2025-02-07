import { asyncHandler, validateInput } from "../utils.js";
import {
  createUser,
  getUserByID,
  getUsers,
  putUser,
  patchUser,
  deleteUser,
} from "../models/userModel.js";
import fastify from "../index.js";

/* TODO:
 * Send JWT on auth success - WIP
 * Endpoints to retrieve all of the messages, chats, tournaments and matches of a given player, ie. http://localhost:9000/users/:id/messages
 * Endpoint to change / reset password of users
 * Avatar handling and storage
 * Friend handling
 * Deleted user handling (make user anonymous)
 * Do not return the hashed password on get / list user - sort of done
 * */

const user_routes = [
  {
    method: "GET",
    url: "/users",
    handler: asyncHandler(async (req, res) => {
      const users = await getUsers();
      res.code(200).send(users);
    }),
  },
  {
    method: "POST",
    url: "/users",
    handler: asyncHandler(async (req, res) => {
      if (!validateInput(req, res, ["username", "password", "email"])) return;
      const user = await createUser(req.body);
      //TEST: Check implementation of JWT
      const token = fastify.jwt.sign(user);
      res.code(201).send({ token });
    }),
  },
  {
    method: "GET",
    url: "/users/:id",
    handler: asyncHandler(async (req, res) => {
      const user = await getUserByID(req.params.id);
      res.code(200).send(user);
    }),
  },
  {
    method: "PUT",
    url: "/users/:id",
    handler: asyncHandler(async (req, res) => {
      if (!validateInput(req, res, ["username", "password", "email"])) return;
      const user = await putUser(req.params.id, req.body);
      res.code(200).send(user);
    }),
  },
  {
    method: "PATCH",
    url: "/users/:id",
    handler: asyncHandler(async (req, res) => {
      if (!validateInput(req, res, [])) return;
      const user = await patchUser(req.params.id, req.body);
      res.code(200).send(user);
    }),
  },
  {
    method: "DELETE",
    url: "/users/:id",
    handler: asyncHandler(async (req, res) => {
      await deleteUser(req.params.id);
      res.code(204);
    }),
  },
];

export default user_routes;
