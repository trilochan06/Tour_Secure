import { Router } from "express";
import User from "../models/User";

const router = Router();

/**
 * POST /api/user/wallet
 * Body: { address: string }  (or { userId, address } if you don't have req.user)
 * Only saves the PUBLIC address; no private keys ever hit the server.
 */
router.post("/wallet", async (req: any, res) => {
  try {
    const userId = req.user?.id || req.body.userId; // adapt to your auth
    const { address } = req.body || {};

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address))
      return res.status(400).json({ error: "Invalid address" });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { blockchainAddress: address } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, address: user.blockchainAddress });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Failed to save wallet address" });
  }
});

export default router;
