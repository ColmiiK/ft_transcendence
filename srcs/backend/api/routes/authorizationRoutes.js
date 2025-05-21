import { asyncHandler, validateInput } from "../utils.js";
import {
  loginUser,
  loginGoogleUser,
  registerUser,
  enable2fa,
  check2fa,
  verify2fa,
  setJWT,
} from "../authUtils.js";
import {
  resetUserPassword,
  checkNewPassword,
  verifyUserResetToken,
  checkCurrentPassword,
} from "../passwordReset.js";
import { getUser, patchUser } from "../models/userModel.js";

// TODO: Remove when done
import { isDebugUser } from "../dev/dummy.js";

export default function createAuthRoutes(fastify) {
  return [
    {
      method: "POST",
      url: "/login",
      handler: asyncHandler(async (req, res) => {
        //TODO: DEBUG USER BYPASS, REMOVE ME WHEN DEV IS DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (isDebugUser(req.body)) {
          const user = await getUser(req.body.username, true);
          await patchUser(user.id, { is_online: 1 });
          user.is_online = 1;
          setJWT(res, user);
          return res.code(200).send(user);
        }
        if (!validateInput(req, res, ["username", "password"])) return;
        let user = await getUser(req.body.username, true);
        if (!user) return res.code(404).send({ error: "User not found" });
        if (user.username === "anonymous") {
          const isAuthorized = await checkCurrentPassword(
            user,
            req.body.password,
          );
          if (!isAuthorized)
            return res.code(400).send({ error: "Invalid password" });
          await patchUser(user.id, { is_deleted: 0 });
          user = await getUser(req.body.username, true);
        }
        const result = await loginUser(user, req.body.password, req.body.totp);
        if (result["error"]) return res.code(401).send(result);
        if (!req.body.totp && user.is_2fa_enabled)
          return res
            .code(202)
            .send({ twoFactor: "2FA is enabled, TOTP code required" });
        setJWT(res, result);
        return res.code(200).send(result);
      }),
    },
    {
      preHandler: [fastify.authenticate],
      method: "GET",
      url: "/logout",
      handler: asyncHandler(async (req, res) => {
        console.log("Logging out user", req.userId);
        res.clearCookie("token", { path: "/" });
        return res.code(200).send({ success: "User successfully logged out" });
      }),
    },
    {
      method: "GET",
      url: "/islogged",
      handler: asyncHandler(async (req, res) => {
        try {
          const { valid, value } = req.unsignCookie(req.cookies.token);
          if (!valid)
            return res.code(401).send({ error: "Invalid cookie signature" });
          const decoded = fastify.jwt.verify(value);
          req.userId = decoded.user;
        } catch (err) {
          return res.code(200).send({ logged: false });
        }
        return res.code(200).send({ logged: true });
      }),
    },
    {
      method: "POST",
      url: "/google/login",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["credential"])) return;
        const result = await loginGoogleUser(req.body.credential);
        setJWT(res, result);
        return res.code(200).send(result);
      }),
    },
    {
      method: "POST",
      url: "/register",
      handler: asyncHandler(async (req, res) => {
        //TODO: DEBUG USER BYPASS, REMOVE ME WHEN DEV IS DONE !!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (isDebugUser(req.body)) {
          const result = await registerUser(req.body);
          setJWT(res, result);
          return res.code(201).send(result);
        }
        if (
          !validateInput(req, res, [
            "username",
            "email",
            "password",
            "confirm_password",
            "language",
          ])
        )
          return;
        if (req.body.password != req.body.confirm_password)
          return res.code(400).send({ error: "Passwords don't match" });
        // TODO: if user already exists, handle it nicely
        const result = await registerUser(req.body);
        setJWT(res, result);
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
      preHandler: [fastify.authenticate],
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
      preHandler: [fastify.authenticate],
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
    {
      preHandler: [fastify.authenticate],
      method: "POST",
      url: "/2fa/disable",
      handler: asyncHandler(async (req, res) => {
        if (!validateInput(req, res, ["totp_code"])) return;
        const user = await getUser(req.userId, true);
        if (!user) return res.code(404).send({ error: "User not found" });
        const isAuthorized = await check2fa(user, req.body.totp_code);
        if (!isAuthorized)
          return res.code(403).send({ error: "Invalid 2FA code" });
        await patchUser(req.userId, { is_2fa_enabled: 0 });
        return res.code(200).send({ success: "2FA successfully disabled" });
      }),
    },
  ];
}
