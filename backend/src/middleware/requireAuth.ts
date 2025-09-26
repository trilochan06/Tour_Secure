import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { getEnv } from "../config/env";

export type Role = "user" | "admin";

export interface AuthedUser {
  id: string;
  email?: string;
  name?: string;
  role?: Role;
}

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

const env = getEnv();
const COOKIE_NAME = env.AUTH_COOKIE_NAME;
const JWT_SECRET = env.JWT_SECRET;

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;

    const cookieToken = (req as any).cookies?.[COOKIE_NAME];
    const token = bearer || cookieToken;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const payload = jwt.verify(token, JWT_SECRET) as {
      id?: string; sub?: string; role?: Role; email?: string; name?: string;
    };

    const id = payload.id || payload.sub;
    if (!id) return res.status(401).json({ error: "Invalid token" });

    const dbUser = await User.findById(id).lean();
    if (!dbUser) return res.status(401).json({ error: "User not found" });

    req.user = {
      id: dbUser._id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      role: (dbUser.role as Role) || "user",
    };

    next();
  } catch (e: any) {
    console.error("requireAuth error:", e?.message || e);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
  