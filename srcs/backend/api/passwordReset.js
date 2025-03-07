import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { getUserByEmail, patchUser } from "./models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
 * @param {Object} data - Payload to check
 * @returns {Object} - Object with success or failure
 */
export async function resetUserPassword(data) {
  const user = await getUserByEmail(data.email);
  if (!user) return null;
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(resetToken, 10);
  await patchUser(user.id, { reset_token: hash });
  // TODO: Change to frontend page
  const link = `http://localhost:9000/resetToken?token=${resetToken}&id=${user.id}`;
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
  });

  return info;
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
  if (!user.reset_token) return false;
  const isAuthorized = await bcrypt.compare(token, user.reset_token);
  if (!isAuthorized) return false;
  await patchUser(user.id, { password: new_password, reset_token: null });
  return true;
}
