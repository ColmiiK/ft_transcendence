import {
  createUser,
  getUserByUsername,
  getUserByEmail,
} from "./models/userModel.js";
import bcrypt from "bcryptjs";
import fastify from "./index.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const asyncHandler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.code(500).send({ error: err.message });
  }
};

export function validateInput(req, res, requiredFields) {
  if (!req.body)
    return res.code(400).send({ error: "Body of request not found" });
  if (Object.keys(req.body).length === 0)
    return res.code(400).send({ error: "At least one field required" });
  const missingFields = requiredFields.filter((field) => !(field in req.body));
  if (missingFields.length > 0) {
    return res.code(400).send({
      error: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  return true;
}

export async function loginUser(data) {
  const user = await getUserByUsername(data.username);
  if (!user) return null;
  const isAuthorized = await bcrypt.compare(data.password, user.password);
  if (!isAuthorized) return false;
  const token = fastify.jwt.sign({ user: user.id });
  const result = Object.assign({}, user, { token });
  delete result.password;
  return result;
}

export async function registerUser(data) {
  const user = await createUser(data);
  const token = fastify.jwt.sign({ user: user.id });
  const result = Object.assign({}, user, { token });
  return result;
}

// TODO: This
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "maddison53@ethereal.email",
    pass: "jn7jnAPss4f63QBp6D",
  },
});

export async function resetUserPassword(data) {
  const user = getUserByEmail(data.email);
  if (!user) return null;
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(resetToken, 10);
  const link = `http://localhost:9000/reset?token=${resetToken}&id=${user.id}`;
  // const info = await sendEmail(user.email, "Password Reset Request", {
  //   name: user.name,
  //   link: link,
  // });
  const info = await transporter.sendEmail({
    from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
    to: "bar@example.com, baz@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });
  console.log(info);
}
