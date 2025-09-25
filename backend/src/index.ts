// backend/src/index.ts
import authRoutes from "./routes/auth.routes";
import alertsRoutes from "./routes/alerts.routes";
import adminRoutes from "./routes/admin.routes";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import mongoose from "mongoose";
import userWalletRouter from "./routes/userWallet.routes";
import efirRouter from "./routes/efir.routes";

import geoRouter from "./routes/geo.routes";
import miscRouter from "./routes/misc.routes";
import digitalIdRouter from "./routes/digitalId";
import safetyRouter from "./routes/safety.routes";   // ✅ safety scores
import reviewsRouter from "./routes/reviews.routes"; // ✅ reviews
import debugRouter from "./routes/debug.routes";     // ✅ debug (dev only)

import { getEnv } from "./config/env";

// ⬇️ NEW: read cookies if your auth uses them (safe to include either way)
import cookieParser from "cookie-parser"; 

config();

async function start() {
  const app = express();

  // ✅ Better CORS: allow your React dev URLs
  const origins = (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean);
  // backend/src/index.ts
  app.use(cors({
    origin: (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],   // <- add
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
  }));

  // ⬇️ NEW: cookie parser should come before any auth middleware/routes
  app.use(cookieParser());

  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  // health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Routers
  app.use("/api/geo", geoRouter);
  app.use("/api", miscRouter);
  app.use("/digital-id", digitalIdRouter);
  app.use("/api/digital-id", digitalIdRouter);
  app.use("/api/auth", authRoutes);
  app.use("/api/alerts", alertsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/safety-scores", safetyRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/user", userWalletRouter);
  
  
  
app.use("/api/efir", efirRouter);
  // ✅ Mount debug routes only in dev/test
  if (process.env.NODE_ENV !== "production") {
    app.use("/api/debug", debugRouter);
  }

  const env = getEnv();

  // 👇 Add helpful timeouts + safe error logging around Mongo connect
  const mongoOpts: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 10_000, // 10s to find a node (prevents hanging)
    socketTimeoutMS: 45_000,          // avoid long-running socket hangs
    maxPoolSize: 10,
  };

  try {
    await mongoose.connect(env.MONGO_URI, mongoOpts);
    console.log("✅ Connected to MongoDB");
  } catch (err: any) {
    // redact password in URI before logging
    const safeUri = env.MONGO_URI.replace(
      /:\/\/([^:]+):([^@]+)@/,
      (_m, user) => `://${user}:***@`
    );
    console.error("❌ Mongo connection failed.");
    console.error("URI:", safeUri);
    console.error("Error:", err?.message || err);
    // Exit so you immediately know the API isn't up due to DB issues
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`✅ API running at http://localhost:${env.PORT}`);
  });
}

start(); // ✅ don’t forget to call start() THIS IS MY CURRENT FILE
