import { asyncHandler, validateInput } from "../utils.js";
import {
  loginUser,
  loginGoogleUser,
  registerUser,
  enable2fa,
  verify2fa,
} from "../authUtils.js";
import {
  resetUserPassword,
  checkNewPassword,
  verifyUserResetToken,
} from "../passwordReset.js";
import { getUser } from "../models/userModel.js";

export default function createAuthRoutes(fastify) {
  return [
    {
      method: "POST",
      url: "/login",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["username", "password"])) return;
        const user = await getUser(req.body.username, true);
        if (!user) return res.code(404).send({ error: "User not found" });
        const result = await loginUser(user, req.body.password, req.body.totp);
        if (result["error"]) return res.code(401).send(result);
        if (!req.body.totp && user.is_2fa_enabled)
          return res
            .code(202)
            .send({ twoFactor: "2FA is enabled, TOTP code required" });
        return res.code(200).send(result);
      }),
    },
    {
      method: "POST",
      url: "/google/login",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["credential"]))
          return res.code(400).send({ error: "Credential not found" });
        const result = await loginGoogleUser(req.body.credential);
        return res.code(200).send(result);
      }),
    },
    {
      method: "POST",
      url: "/register",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "username",
            "email",
            "password",
            "confirm_password",
          ])
        )
          return;
        if (req.body.password != req.body.confirm_password)
          return res.code(400).send({ error: "Passwords don't match" });
        const result = await registerUser(req.body);
        return res.code(201).send(result);
      }),
    },
    {
      method: "POST",
      url: "/reset",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["email"])) return;
        const user = await getUser(req.body.email);
        if (!user) return res.code(404).send({ error: "User not found" });
        const result = await resetUserPassword(user);
        if (result == null)
          return res.code(404).send({ error: "User not found" });
        return res.code(200).send(result);
      }),
    },
    {
      method: "POST",
      url: "/resetToken",
      handler: asyncHandler(async (req, res) => {
        if (
          !validateInput(req, res, [
            "token",
            "id",
            "password",
            "confirm_password",
          ])
        )
          return;
        if (req.body.password != req.body.confirm_password)
          return res.code(400).send({ error: "Passwords don't match" });
        const user = await getUser(req.body.id, true);
        if (!user) return res.code(404).send({ error: "User not found" });
        if (!user.reset_token)
          return res.code(403).send({ error: "Reset token has expired" });
        if (user.password) {
          const samePassword = await checkNewPassword(user, req.body.password);
          if (samePassword)
            return res
              .code(400)
              .send({ error: "New password matches the old one" });
        }
        const verified = await verifyUserResetToken(
          user,
          req.body.token,
          req.body.password,
        );
        if (verified === false)
          return res.code(403).send({ error: "Authorization failed" });
        return res.code(200).send({ success: "Password successfully updated" });
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "GET",
      url: "/2fa/enable",
      handler: asyncHandler(async (req, res) => {
        const user = await getUser(req.userId);
        if (!user) return res.code(404).send({ error: "User not found" });
        if (user.is_2fa_enabled === 1)
          return res.code(400).send({ error: "2FA already enabled" });
        const qr = await enable2fa(user);
        return res.code(200).send(qr);
      }),
    },
    {
      onRequest: [fastify.authenticate],
      method: "POST",
      url: "/2fa/verify",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["totp_code"])) return;
        const user = await getUser(req.userId);
        if (!user) return res.code(404).send({ error: "User not found" });
        const result = await verify2fa(user, req.body.totp_code);
        if (result === false)
          return res.code(400).send({ error: "Unable to verify TOTP code" });
        return res.code(200).send(result);
      }),
    },
  ];
}
