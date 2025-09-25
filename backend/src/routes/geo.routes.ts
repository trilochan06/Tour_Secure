import { Router } from "express";
import { createZone, listZones, checkPoint } from "../controllers/geo.controller";

const router = Router();

router.post("/zones", createZone);
router.get("/zones", listZones);
router.post("/check", checkPoint);

export default router;
