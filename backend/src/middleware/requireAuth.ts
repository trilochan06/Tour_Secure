import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "Server misconfigured (JWT_SECRET)" });

    // Your token uses { id, role, email, name }
    const payload = jwt.verify(token, secret) as {
      id?: string;
      role?: Role;
      email?: string;
      name?: string;
      sub?: string;
    };

    const id = payload.id || payload.sub;
    if (!id) return res.status(401).json({ error: "Unauthorized" });

    req.user = {
      id,
      email: payload.email,
      name: payload.name,
      role: (payload.role as Role) || "user",
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
