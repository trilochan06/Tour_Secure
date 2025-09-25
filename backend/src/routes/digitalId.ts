import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import multer from "multer";
import QRCode from "qrcode";
import crypto from "crypto";

const r = Router();

// Limit uploads to 5 MB (matches your UI hint)
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Simple in-memory store for demo; swap for Mongo later
type Trip = {
  id: string;
  userId: string;
  walletAddress: string;
  entrypoint: "airport" | "hotel" | "checkpost";
  docType: "passport" | "aadhaar";
  startAt: string; // ISO
  endAt: string;   // ISO
  emergencyContacts: Array<{ name: string; phone: string }>;
  filename?: string;
  mime?: string;
  size?: number;
  tokenId: number;
  validUntil: number; // epoch seconds
  createdAt: string;
};
const TRIPS = new Map<string, Trip>();

// POST /api/digital-id/trips  (multipart/form-data, field: "document")
r.post("/trips", requireAuth, upload.single("document"), async (req: AuthedRequest, res) => {
  try {
    const b = req.body || {};
    const userId = req.user!.id;

    const walletAddress = String(b.walletAddress || "").trim();
    const entrypoint = b.entrypoint as Trip["entrypoint"];
    const docType = b.docType as Trip["docType"];
    const startAt = String(b.startAt || "").trim();
    const endAt = String(b.endAt || "").trim();

    if (!walletAddress) return res.status(400).json({ error: "walletAddress is required" });
    if (!["airport", "hotel", "checkpost"].includes(String(entrypoint)))
      return res.status(400).json({ error: "entrypoint invalid" });
    if (!["passport", "aadhaar"].includes(String(docType)))
      return res.status(400).json({ error: "docType invalid" });
    if (!startAt || !endAt) return res.status(400).json({ error: "startAt/endAt required" });
    if (!req.file) return res.status(400).json({ error: "document file is required" });

    let emergencyContacts: Trip["emergencyContacts"] = [];
    if (b.emergencyContacts) {
      try {
        const parsed = JSON.parse(b.emergencyContacts);
        emergencyContacts = Array.isArray(parsed) ? parsed : [];
      } catch {
        emergencyContacts = [];
      }
    }

    const id = crypto.randomUUID();
    const tokenId = Math.floor(Math.random() * 1_000_000);
    const validUntil = Math.floor(new Date(endAt).getTime() / 1000);

    const trip: Trip = {
      id,
      userId,
      walletAddress,
      entrypoint,
      docType,
      startAt,
      endAt,
      emergencyContacts,
      filename: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
      tokenId,
      validUntil,
      createdAt: new Date().toISOString(),
    };

    TRIPS.set(id, trip);
    return res.json({ ok: true, id, tokenId, validUntil });
  } catch (e) {
    console.error("digital-id POST /trips error:", e);
    return res.status(500).json({ error: "Failed to create trip" });
  }
});

// GET /api/digital-id/trips  (list; use ?mine=1 to filter by current user)
r.get("/trips", requireAuth, async (req: AuthedRequest, res) => {
  const mine = req.query.mine ? String(req.query.mine) : "";
  const all = Array.from(TRIPS.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const list = mine ? all.filter((t) => t.userId === req.user!.id) : all;
  return res.json({ items: list });
});

// GET /api/digital-id/trips/:id
r.get("/trips/:id", requireAuth, async (req: AuthedRequest, res) => {
  const trip = TRIPS.get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Not found" });
  if (trip.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  return res.json(trip);
});

// GET /api/digital-id/trips/:id/qr  (QR code PNG; returns 410 Gone if expired)
r.get("/trips/:id/qr", requireAuth, async (req: AuthedRequest, res) => {
  const trip = TRIPS.get(req.params.id);
  if (!trip) return res.status(404).end();
  if (Date.now() / 1000 > trip.validUntil) return res.status(410).end();

  const payload = JSON.stringify({ id: trip.id, tokenId: trip.tokenId, exp: trip.validUntil });
  const png = await QRCode.toBuffer(payload, { width: 512 });
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

export default r;
