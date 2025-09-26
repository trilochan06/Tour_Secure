import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env";
import { connectMongo } from "./config/db";

// Routers
import authRoutes from "./routes/auth.routes";
import alertsRoutes from "./routes/alerts.routes";
import adminRoutes from "./routes/admin.routes";
import userWalletRouter from "./routes/userWallet.routes";
import efirRouter from "./routes/efir.routes";
import geoRouter from "./routes/geo.routes";
import miscRouter from "./routes/misc.routes";
import digitalIdRouter from "./routes/digitalId";
import safetyRouter from "./routes/safety.routes";
import reviewsRouter from "./routes/reviews.routes";
import debugRouter from "./routes/debug.routes";

async function start() {
  const env = getEnv();
  const app = express();

  app.set("trust proxy", 1);

  app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  app.options("*", cors({ origin: env.CORS_ORIGINS, credentials: true }));

  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true })); // accept form posts too
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  // Health
  app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

  // TEMP debug for auth payloads (remove once stable)
  // app.use("/api/auth", (req, _res, next) => { console.log("[AUTH DEBUG]", req.method, req.path, req.headers["content-type"]); console.log("body:", req.body); next(); });

  // Routes
  app.use("/api/geo", geoRouter);
  app.use("/api", miscRouter);
  app.use("/api/digital-id", digitalIdRouter);
  app.use("/api/auth", authRoutes);
  app.use("/api/alerts", alertsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/safety-scores", safetyRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/user", userWalletRouter);
  app.use("/api/efir", efirRouter);
  app.use("/api/digital-id", digitalIdRouter);
  if (env.NODE_ENV !== "production") app.use("/api/debug", debugRouter);

  await connectMongo();

  app.listen(env.PORT, () => {
    console.log(`✅ API running at http://localhost:${env.PORT}`);
  });
}
start();
