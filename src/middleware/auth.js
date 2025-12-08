import { verifyToken } from "../utils/jwt.js";

export default function authenticate(req, res, next) {
  const header = req.headers["authorization"] || "";
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ status : 401, message: "Unauthorized" });
  try {
    const payload = verifyToken(parts[1]);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ status : 401, message: "Unauthorized" });
  }
}
