import { Router } from "express";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { ethers } from "ethers";
import { issueTouristID, getContractAddress } from "../blockchain";

const r = Router();

const upload = multer({ dest: "/tmp", limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const FILE_DIR = process.env.FILE_STORAGE_DIR || "./secure_uploads";
const JWT_SECRET = process.env.JWT_SECRET!;
const BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:4000";

fs.mkdirSync(FILE_DIR, { recursive: true });

function wrapKey(dataKey: Buffer) {
  const kek = Buffer.from(process.env.JWT_SECRET || "").slice(0, 32);
  const out = Buffer.alloc(dataKey.length);
  for (let i = 0; i < dataKey.length; i++) out[i] = dataKey[i] ^ kek[i % kek.length];
  return out;
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

/** POST /digital-id/trips  (multipart) */
r.post("/trips", upload.single("document"), async (req, res) => {
  try {
    const { walletAddress, entrypoint, docType, startAt, endAt } = req.body;
    const emergencyContacts = JSON.parse(req.body.emergencyContacts || "[]");

    if (!req.file) throw new Error("Missing document");
    if (!ethers.isAddress(walletAddress)) throw new Error("Invalid walletAddress");

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (isNaN(+start) || isNaN(+end)) throw new Error("Invalid startAt/endAt");
    if (end.getTime() <= Date.now()) throw new Error("endAt must be future");

    // Encrypt file (AES-256-GCM)
    const dataKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
    const outId = uid();
    const outPath = path.join(FILE_DIR, `${outId}.enc`);

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path).pipe(cipher).pipe(fs.createWriteStream(outPath))
        .on("finish", () => resolve())
        .on("error", reject);
    });
    const tag = cipher.getAuthTag();
    const keyEnc = wrapKey(dataKey);

    const kycPreimage = `${outPath}|${start.toISOString()}|${end.toISOString()}`;
    const kycHash = ethers.keccak256(ethers.toUtf8Bytes(kycPreimage));

    const tokenURI = `${BASE_URL}/digital-id/token-uri/${outId}.json`; // placeholder
    const validUntil = Math.floor(end.getTime() / 1000);

    const { tokenId, txHash } = await issueTouristID(walletAddress, tokenURI, kycHash, validUntil);

    const id = uid();
    const trip = {
      id,
      entrypoint,
      docType,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      emergencyContacts,
      tokenId,
      contractAddress: getContractAddress(),
      tokenURI,
      kycHash,
      docIV: iv.toString("base64"),
      docTag: tag.toString("base64"),
      docKeyEnc: keyEnc.toString("base64"),
      docPath: outPath,
      status: "active",
      createdAt: new Date().toISOString()
    };

    // For now, respond directly (you can persist later)
    res.json({ ok: true, id, tokenId, validUntil, txHash, trip });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  } finally {
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
  }
});

/** GET /digital-id/trips/:id/qr  (demo QR that expires at endAt) */
r.get("/trips/:id/qr", async (req, res) => {
  // In a real app you’d fetch trip by id; here, simple demo token:
  const exp = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
  const token = jwt.sign({ tripId: req.params.id, exp }, JWT_SECRET);
  const verifyUrl = `${BASE_URL}/digital-id/verify?jwt=${token}`;
  const png = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 320 });
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

/** GET /digital-id/verify?jwt=... */
r.get("/verify", (req, res) => {
  try {
    const token = String(req.query.jwt || "");
    jwt.verify(token, JWT_SECRET);
    res.json({ ok: true, valid: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export default r;
