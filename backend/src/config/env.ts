// backend/src/config/env.ts
import "dotenv/config";

function required(label: string, val?: string) {
  if (!val) throw new Error(`Missing required env var: ${label}`);
  return val;
}

export function getEnv() {
  const PORT = Number(process.env.PORT || 4000);
  const NODE_ENV = process.env.NODE_ENV || "development";

  // Accept either MONGO_URI or MONGODB_URI
  const MONGO_URI = required(
    "MONGO_URI or MONGODB_URI",
    process.env.MONGO_URI || process.env.MONGODB_URI
  );

  const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "ts_sess";
  const JWT_SECRET = required("JWT_SECRET", process.env.JWT_SECRET);
  const JWT_EXPIRES_DAYS = Number(process.env.JWT_EXPIRES_DAYS || 7);

  return {
    PORT,
    NODE_ENV,
    MONGO_URI,
    CORS_ORIGINS,
    AUTH_COOKIE_NAME,
    JWT_SECRET,
    JWT_EXPIRES_DAYS,
  };
}
