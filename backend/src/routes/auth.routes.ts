import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { getEnv } from "../config/env";

const r = Router();
const env = getEnv();
const COOKIE_NAME = env.AUTH_COOKIE_NAME;
const JWT_EXPIRES_DAYS = env.JWT_EXPIRES_DAYS;
const JWT_SECRET = env.JWT_SECRET;
const isProd = env.NODE_ENV === "production";

function sign(u: any) {
  return jwt.sign(
    { id: u._id.toString(), role: u.role, email: u.email, name: u.name },
    JWT_SECRET,
    { expiresIn: `${JWT_EXPIRES_DAYS}d` }
  );
}
function setSessionCookie(res: any, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd ? true : false,
    sameSite: isProd ? "none" : "lax",
    maxAge: JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
  });
}
function clearSessionCookie(res: any) {
  res.clearCookie(COOKIE_NAME, { path: "/", domain: process.env.COOKIE_DOMAIN || undefined });
}
function sanitizeUser(u: any) {
  return { id: u._id?.toString?.() ?? String(u.id), name: u.name, email: u.email, role: u.role || "user", createdAt: u.createdAt };
}

// REGISTER
r.post("/register", async (req, res) => {
  try {
    let { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    email = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await User.create({
      name: String(name).trim(),
      email,
      passwordHash,
      role: role === "admin" ? "admin" : "user",
    });

    const token = sign(user);
    setSessionCookie(res, token);
    return res.status(201).json({ ok: true, user: sanitizeUser(user), token }); // token for API clients; web uses cookie
  } catch (e: any) {
    console.error("REGISTER error:", e);
    return res.status(500).json({ error: e?.message || "Registration failed" });
  }
});

// LOGIN (with legacy plaintext migration)
r.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    email = String(email).toLowerCase().trim();
    const user: any = await User.findOne({ email }).select("+password"); // include legacy if any

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (user.passwordHash) {
      const ok = await bcrypt.compare(String(password), String(user.passwordHash));
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const token = sign(user);
      setSessionCookie(res, token);
      return res.json({ ok: true, user: sanitizeUser(user), token });
    }

    if (user.password && typeof user.password === "string") {
      if (String(user.password) !== String(password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const newHash = await bcrypt.hash(String(password), 12);
      user.passwordHash = newHash;
      user.password = undefined;
      await user.save();
      const token = sign(user);
      setSessionCookie(res, token);
      return res.json({ ok: true, user: sanitizeUser(user), token });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (e: any) {
    console.error("LOGIN error:", e);
    return res.status(500).json({ error: e?.message || "Login failed" });
  }
});

// WHOAMI
r.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  return res.json({ ok: true, user: req.user });
});

// LOGOUT
r.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

export default r;
