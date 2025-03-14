import { pipeline } from "node:stream/promises";
import { createWriteStream, unlink } from "node:fs";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { getUser, patchUser } from "./models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Wraps a function in a try catch with await
 * @param {Function} fn - Function to wrap
 */
export const asyncHandler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.code(500).send({ error: err.message });
  }
};

/**
 * Checks if a given request has specific fields
 * @param {Request} req - Request to check values from
 * @param {Response} res - Response to return codes
 * @param {Array} requiredFields - Fields to check for
 * @returns {Boolean} - True if successful, false if not
 */
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
  if (requiredFields.includes("password")) {
    const password = req.body.password;
    if (password.length < 9)
      return res.code(400).send({ error: "Password is too short" });
    else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[*\.\-_]/.test(password)
    )
      return res.code(400).send({ error: "Password composition is incorrect" });
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
  const uploadDir = path.join(__dirname, "avatars");
  const filename = `${Date.now()}-${data.filename}`;
  const filepath = path.join(uploadDir, filename);
  await pipeline(data.file, createWriteStream(filepath));
  const user = await getUser(user_id);
  const old_avatar = user.avatar;
  const default_avatar = "/usr/transcendence/api/avatars/default.jpg";
  await patchUser(user_id, { avatar: filepath });
  if (old_avatar != default_avatar) {
    unlink(old_avatar, (err) => {
      if (err) return { error: err.message };
    });
  }
  return {
    message: "File uploaded successfully",
    id: user_id,
    fileDetails: {
      filename: filename,
      originalName: data.filename,
      mimetype: data.mimetype,
      size: data.file.bytesRead,
    },
  };
}
