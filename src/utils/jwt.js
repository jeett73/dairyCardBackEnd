import jwt from "jsonwebtoken";
import config from "../config/index.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn, algorithm: "HS256" });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, { algorithms: ["HS256"] });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.refreshJwt.secret, {
    expiresIn: config.refreshJwt.expiresIn,
    algorithm: "HS256"
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshJwt.secret, { algorithms: ["HS256"] });
}
