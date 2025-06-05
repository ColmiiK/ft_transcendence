import path from "node:path";
import { fileURLToPath } from "url";
import { getUser, patchUser } from "./models/userModel.js";
import assert from "node:assert/strict";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "avatars");
export { UPLOAD_DIR };

/**
 * Wraps a function in a try catch with await
 * @param {Function} fn - Function to wrap
 */
export const asyncHandler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err?.name === "AssertionError" || err?.code === "ERR_ASSERTION") {
      console.error(err);
      process.exit(1);
    }
    res.code(500).send({ error: err.message });
  }
};

export const asyncWebSocketHandler = (fn) => {
  return async (connection, req) => {
    try {
      return await fn(connection, req);
    } catch (err) {
      console.error("ERROR:", err.message);
      try {
        connection.socket.send(
          JSON.stringify({
            error: true,
            message: err.message,
          }),
        );
      } catch (socketErr) {
        console.error("Failed to send error over WebSocket:", socketErr);
      }
    }
  };
};

/**
 * Checks if a given request has specific fields
 * @param {Request} req - Request to check values from
 * @param {Response} res - Response to return codes
 * @param {Array} requiredFields - Fields to check for
 * @returns {Boolean} - True if successful, false if not
 */
export function validateInput(req, res, requiredFields) {
  assert(req !== undefined, "req must exist");
  assert(res !== undefined, "res must exist");
  if (!req.body) {
    res.code(400).send({ error: "Body of request not found" });
    return false;
  }
  if (Object.keys(req.body).length === 0) {
    res.code(400).send({ error: "At least one field required" });
    return false;
  }
  const missingFields = requiredFields.filter((field) => !(field in req.body));
  if (missingFields.length > 0) {
    res.code(400).send({
      error: `Missing required fields: ${missingFields.join(", ")}`,
    });
    return false;
  }
  if (
    requiredFields.includes("password") ||
    requiredFields.includes("new_password")
  ) {
    const password = req.body.password || req.body.new_password || "";
    if (password.length < 9) {
      res.code(400).send({ error: "Password is too short" });
      return false;
    } else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[*\.\-_]/.test(password)
    ) {
      res.code(400).send({ error: "Password composition is incorrect" });
      return false;
    }
  }
  if (requiredFields.includes("username")) {
    const username = req.body.username;
    if (username.length < 4) {
      res.code(400).send({ error: "Minimum username length is 4 characters" });
      return false;
    }
    if (username.length > 16) {
      res.code(400).send({ error: "Maximum username length is 16 characters" });
      return false;
    }
  }
  if (requiredFields.includes("delete_input")) {
    const delete_input = req.body.delete_input;
    if (delete_input !== "Delete") {
      res.code(400).send({ error: "Delete confirmation failed" });
      return;
    }
  }
  if (requiredFields.includes("users")) {
    const users = req.body.users;
    const usernames = users.map((user) => user.username);
    const isUnique = new Set(usernames).size === usernames.length;
    console.log("isUnique:", isUnique);
    if (!isUnique) {
      res.code(400).send({ error: "Usernames are not all unique" });
      return;
    }
  }
  return true;
}

/**
 * Checks if a given user is deleted, and if it is
 * modifies it, giving it an anonymous name
 * @param {Object} user - User to check
 * @returns {Object} - Modified user
 */
export function anonymize(user) {
  assert(user !== undefined, "user must exist");
  if (!user.is_deleted) {
    delete user.is_deleted;
  } else {
    delete user.is_deleted;
    user.username = "anonymous";
    user.email = "anonymous@mail.com";
  }
  return user;
}

/**
 * Saves a given image as the avatar of an user,
 * deleting the old one in the process
 * @param {Number} user_id - ID of the user
 * @param {Object} data - Payload to add the image from
 * @returns {Object} - Object with the ID and metadata of the avatar
 */
export async function saveAvatar(user_id, data) {
  assert(user_id !== undefined, "user_id must exist");
  assert(data !== undefined, "data must exist");

  const buffer = await data.toBuffer();
  const resizedBuffer = await sharp(buffer)
    .resize(256, 256, { fit: "cover", position: "center" })
    .webp({ quality: 85 })
    .toBuffer();
  const base64Image = resizedBuffer.toString("base64");
  const dataUrl = `data:image/webp;base64,${base64Image}`;
  await patchUser(user_id, { avatar: dataUrl });
  return {
    message: "Avatar uploaded successfully",
    data_url: dataUrl,
    user_id: user_id,
    originalName: data.filename,
    mimetype: "image/webp",
    size: resizedBuffer.length,
    originalSize: buffer.length,
  };
}
