// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function authRequired(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "missing authorization header" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "invalid or expired token" });
  }
}
