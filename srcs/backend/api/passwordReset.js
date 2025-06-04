import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { fileURLToPath } from "url";
import { patchUser } from "./models/userModel.js";
import assert from "node:assert/strict";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends the user a link to reset their password
 * @param {Object} user - The user to reset their password
 * @returns {Object} - Object with success or failure
 */
export async function resetUserPassword(user) {
  assert(user !== undefined, "user must exist");
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(resetToken, 10);
  await patchUser(user.id, { reset_token: hash });
  const link = `https://${process.env.HOSTNAME}:8443/reset-password?token=${resetToken}&id=${user.id}`;
  const template = await fs.promises.readFile(
    path.resolve(__dirname, "./templates/passwordReset.html"),
    "utf-8",
  );
  const compiledTemplate = handlebars.compile(template);
  const html = compiledTemplate({ userName: user.username, resetLink: link });

  const info = await transporter.sendMail({
    from: `"Transcendence" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Request",
    text: link,
    html: html,
    success: true,
  });

  return info;
}

export async function checkNewPassword(user, new_password) {
  assert(user !== undefined, "user must exist");
  assert(new_password !== undefined, "new_password must exist");
  const result = await bcrypt.compare(new_password, user.password);
  return result;
}

export async function checkCurrentPassword(user, password) {
  assert(user !== undefined, "user must exist");
  assert(password !== undefined, "password must exist");
  const isAuthorized = await bcrypt.compare(password, user.password);
  if (!isAuthorized) return { error: "Incorrect password" };
  return true;
}

/**
 * Completes the change of password, checking the token first
 * @param {Object} user - User to change password
 * @param {String} token - Reset token
 * @param {String} new_password - New password to update with
 * @returns {Boolean} - true if successful,
 *                      false if token does not match
 */
export async function verifyUserResetToken(user, token, new_password) {
  assert(user !== undefined, "user must exist");
  assert(token !== undefined, "token must exist");
  assert(new_password !== undefined, "new_password must exist");
  const isAuthorized = await bcrypt.compare(token, user.reset_token);
  await patchUser(user.id, { reset_token: null });
  if (!isAuthorized) return false;
  await patchUser(user.id, { password: new_password });
  return true;
}
