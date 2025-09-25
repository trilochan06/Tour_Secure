// backend/src/routes/auth.routes.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const r = Router();

function sign(u: any) {
  return jwt.sign(
    { id: u._id.toString(), role: u.role, email: u.email, name: u.name },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
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

    return res.json({ token: sign(user) });
  } catch (e: any) {
    console.error("REGISTER error:", e);
    return res.status(500).json({ error: e?.message || "Registration failed" });
  }
});

// LOGIN (with guards + legacy plaintext migration)
r.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    email = String(email).toLowerCase().trim();
    const user: any = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // If passwordHash exists, use it
    if (user.passwordHash) {
      const ok = await bcrypt.compare(String(password), String(user.passwordHash));
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      return res.json({ token: sign(user) });
    }

    // Legacy fallback: if a plaintext "password" field exists (bad old data)
    if (user.password && typeof user.password === "string") {
      // Compare plaintext EXACTLY once, then migrate
      if (String(user.password) !== String(password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      // Migrate: replace plaintext with bcrypt hash
      const newHash = await bcrypt.hash(String(password), 12);
      user.passwordHash = newHash;
      user.password = undefined; // remove plaintext
      await user.save();
      return res.json({ token: sign(user) });
    }

    // No usable password on record
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (e: any) {
    console.error("LOGIN error:", e);
    return res.status(500).json({ error: e?.message || "Login failed" });
  }
});

// WHOAMI
r.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  return res.json(req.user);
});

export default r;
