import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth } from "../middleware/auth";

const r = Router();

function sign(u: any) {
  return jwt.sign({ id: u._id.toString(), role: u.role, email: u.email, name: u.name }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

r.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: role === "admin" ? "admin" : "user" });
  res.json({ token: sign(user) });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: sign(user) });
});

r.get("/me", requireAuth, async (req: any, res) => {
  res.json(req.user);
});

export default r;
