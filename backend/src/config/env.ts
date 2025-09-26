import "dotenv/config";

function required(name: string, value?: string) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getEnv() {
  const PORT = Number(process.env.PORT || 4000);
  const NODE_ENV = process.env.NODE_ENV || "development";

  // your .env uses MONGO_URI; we also fallback to MONGODB_URI if present
  const MONGO_URI = required(
    "MONGO_URI or MONGODB_URI",
    process.env.MONGO_URI || process.env.MONGODB_URI
  );

  const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
  const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "ts_auth";
  const JWT_SECRET = required("JWT_SECRET", process.env.JWT_SECRET);
  const JWT_EXPIRES_DAYS = Number(process.env.JWT_EXPIRES_DAYS || 7);

  return {
    PORT,
    NODE_ENV,
    MONGO_URI,
    CORS_ORIGINS,
    COOKIE_DOMAIN,
    AUTH_COOKIE_NAME,
    JWT_SECRET,
    JWT_EXPIRES_DAYS,
  };
}
