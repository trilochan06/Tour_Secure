// backend/src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { getEnv } from "../config/env";

export type Role = "user" | "admin";
export interface AuthedUser { id: string; email?: string; name?: string; role?: Role; }
export interface AuthedRequest extends Request { user?: AuthedUser; }

// Shape we expect back from jwt.verify (keep loose to avoid runtime type errors)
type JwtVerified =
  | (jwt.JwtPayload & { sub?: string; id?: string; email?: string; role?: Role })
  | string;

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const { AUTH_COOKIE_NAME, JWT_SECRET, NODE_ENV } = getEnv();

  // --- Try multiple places for token (keep your original approach/order) ---
  const hdr = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
  const bearer = hdr && hdr.startsWith("Bearer ") ? hdr.slice(7).trim() : null;
  const cookieTok = (req.cookies && req.cookies[AUTH_COOKIE_NAME]) || null;
  const altTok = (req.headers["x-access-token"] as string) || null;

  const token = bearer || cookieTok || altTok;

  if (!token) {
    if (NODE_ENV !== "production") {
      console.warn("requireAuth: no token. hasCookie=", !!cookieTok, "hasBearer=", !!bearer, "hasAlt=", !!altTok);
    }
    return res.status(401).json({ error: "Unauthorized", reason: "missing_token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtVerified;

    // Support both JWT `sub` (standard) and custom `id`
    const payload = typeof decoded === "string" ? {} as jwt.JwtPayload : decoded;
    const userId = String((payload as any).sub || (payload as any).id || "");

    if (!userId) {
      if (NODE_ENV !== "production") {
        console.error("requireAuth: token missing sub/id. payload=", payload);
      }
      return res.status(401).json({ error: "Unauthorized", reason: "bad_payload" });
    }

    // Ensure user still exists / load minimal fields
    const dbUser = await User.findById(userId).lean();
    if (!dbUser) {
      return res.status(401).json({ error: "Unauthorized", reason: "user_not_found" });
    }

    // Attach normalized user onto req
    req.user = {
      id: dbUser._id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      role: (dbUser.role as Role) || (payload as any).role || "user",
    };

    return next();
  } catch (e: any) {
    const kind =
      e?.name === "TokenExpiredError" ? "token_expired" :
      e?.name === "JsonWebTokenError" ? "invalid_signature" :
      "verify_failed";

    if (NODE_ENV !== "production") {
      console.error("requireAuth verify error:", e?.name, e?.message);
    }

    return res.status(401).json({ error: "Unauthorized", reason: kind });
  }
}
