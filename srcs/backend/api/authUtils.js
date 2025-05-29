import {
  getUser,
  createUser,
  createGoogleUser,
  patchUser,
} from "./models/userModel.js";
import bcrypt from "bcryptjs";
import fastify from "./index.js";
import qrcode from "qrcode";
import { authenticator } from "otplib";
import { OAuth2Client } from "google-auth-library";
import assert from "node:assert/strict";

/**
 * Logs the user
 * @param {Object} user - User to evaluate
 * @param {String} password - Password to check
 * @param {String} totp_token - TOTP for 2FA
 * @returns {Object} - An object with the user,
 *                     or with an error if not
 */
export async function loginUser(user, password, totp_token = null) {
  assert(user !== undefined, "user must exist");
  assert(password !== undefined, "password must exist");
  const isAuthorized = await bcrypt.compare(password, user.password);
  if (!isAuthorized) return { error: "Incorrect password" };
  if (totp_token) {
    const totpVerified = authenticator.check(totp_token, user.totp_secret);
    if (!totpVerified) return { error: "Invalid 2FA code" };
  }
  const result = Object.assign({}, user, { success: true });
  delete result.password;
  delete result.totp_secret;
  await patchUser(user.id, { is_online: 1 });
  return result;
}

export async function check2fa(user, totp_token) {
  assert(user !== undefined, "user must exist");
  assert(totp_token !== undefined, "totp_token must exist");

  const totp_verified = authenticator.check(totp_token, user.totp_secret);
  if (!totp_verified) return false;
  return true;
}

export async function checkCurrentPassword(user, password) {
  assert(user !== undefined, "user must exist");
  assert(password !== undefined, "password must exist");

  const isAuthorized = await bcrypt.compare(password, user.password);
  if (!isAuthorized) return { error: "Incorrect password" };
  return true;
}

function parseUsername(email) {
  assert(email !== undefined, "email must exist");
  const name = email.split("@")[0].substring(0, 16);
  const parsed = name.replace(/[^0-9a-z-A-Z ]/g, "").replace(/ +/, " ");
  return parsed;
}

/**
 * Logs the user through Google
 * @param {String} credential - The authentication token
 * @returns {Object} - The logged in user, with a JWT
 */
export async function loginGoogleUser(credential) {
  assert(credential !== undefined, "credential must exist");
  const client = new OAuth2Client(process.env.CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const googleId = payload["sub"];
  const email = payload["email"];
  const name = parseUsername(email);
  let user = await getUser(email, true);
  if (!user) {
    user = await createGoogleUser({
      username: name,
      email: email,
      googleId: googleId,
    });
  } else {
    await patchUser(user.id, { google_id: googleId });
    delete user.password;
    delete user.totp_secret;
    delete user.google_id;
  }
  await patchUser(user.id, { is_online: 1 });
  const result = Object.assign({}, user, { success: true });
  return result;
}

//TODO: Needs testing
export async function verifyGoogleUser(credential) {
  assert(credential !== undefined, "credential must exist");
  const client = new OAuth2Client(process.env.CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const email = payload["email"];
  let user = await getUser(email, true);
  if (!user) {
    return { error: "User not found" };
  }
  return true;
}

/**
 * Starts the 2FA process by generating a secret and
 * returning a QR for the user to scan
 * @param {Object} user - The user to enable 2FA
 * @returns {Object} - The QR code to scan
 */
export async function enable2fa(user) {
  assert(user !== undefined, "user must exist");
  const secret = authenticator.generateSecret();
  await patchUser(user.id, { pending_totp_secret: secret });
  const keyUri = authenticator.keyuri(user.username, "Transcendence", secret);
  const qr = await qrcode.toDataURL(keyUri);
  return { qr_code: qr };
}

/**
 * Finishes the 2FA initial handshake to enable it
 * @param {Object} user - User to work on
 * @param {String} totpCode - Code inputed from the user
 * @returns {Object} - Success or failure
 */
export async function verify2fa(user, totpCode) {
  assert(user !== undefined, "user must exist");
  assert(totpCode !== undefined, "totpCode must exist");
  const totpVerified = authenticator.verify({
    token: totpCode,
    secret: user.pending_totp_secret,
  });
  if (!totpVerified) return false;
  const secret = user.pending_totp_secret;
  await patchUser(user.id, {
    pending_totp_secret: null,
    totp_secret: secret,
    is_2fa_enabled: true,
  });
  return {
    success: `2FA successfully enabled for user with ID ${user.id}`,
  };
}

/**
 * Registers a user, creating it and giving a JWT
 * @param {Object} data - Payload to evaluate
 * @returns {Object} - An object with the full user information and a JWT
 */
export async function registerUser(data) {
  assert(data !== undefined, "data must exist");
  const user = await createUser(data);
  const result = Object.assign({}, user, { success: true });
  return result;
}

/**
 * Sets the JWT cookie in the client's browser
 * @param {Object} res - Response for the frontend
 * @param {Object} user - User in question
 */
export function setJWT(res, user) {
  assert(res !== undefined, "response must exist");
  assert(user !== undefined, "user must exist");
  const token = fastify.jwt.sign({ user: user.id });
  res.cookie("token", token, {
    signed: true,
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 3600 * 24 * 1000,
    path: "/",
  });
}
