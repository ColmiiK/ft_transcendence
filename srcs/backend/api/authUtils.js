import { createUser, patchUser } from "./models/userModel.js";
import bcrypt from "bcryptjs";
import fastify from "./index.js";
import qrcode from "qrcode";
import { authenticator } from "otplib";

/**
 * Logs the user
 * @param {Object} user - User to evaluate
 * @param {String} password - Password to check
 * @param {String} totp_token - TOTP for 2FA
 * @returns {Object} - An object with the user and a JWT if successful,
 *                     false if the password is incorrect,
 *                     null if the user does not exist
 */
export async function loginUser(user, password, totp_token = null) {
  const isAuthorized = await bcrypt.compare(password, user.password);
  if (!isAuthorized) return false;
  if (totp_token) {
    const totpVerified = authenticator.check(totp_token, user.totp_secret);
    if (!totpVerified) return false;
  }
  const token = fastify.jwt.sign({ user: user.id });
  const result = Object.assign({}, user, { token });
  delete result.password;
  delete result.totp_secret;
  await patchUser(user.id, { is_online: 1 });
  return result;
}

/**
 * Starts the 2FA process by generating a secret and
 * returning a QR for the user to scan
 * @param {Object} user - The user to enable 2FA
 * @returns {Object} - The QR code to scan
 */
export async function enable2fa(user) {
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
  const user = await createUser(data);
  const token = fastify.jwt.sign({ user: user.id });
  const result = Object.assign({}, user, { token });
  return result;
}
