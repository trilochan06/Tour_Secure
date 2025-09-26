import mongoose from "mongoose";
import { getEnv } from "./env";

const env = getEnv();
let isReady = false;

const mongoOpts: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
};

export async function connectMongo() {
  if (isReady) return mongoose;

  mongoose.connection.on("connected", () => {
    isReady = true;
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  });

  mongoose.connection.on("error", (err) => {
    isReady = false;
    console.error("❌ MongoDB error:", err?.message || err);
  });

  mongoose.connection.on("disconnected", () => {
    isReady = false;
    console.warn("⚠️ MongoDB disconnected");
  });

  try {
    await mongoose.connect(env.MONGO_URI, mongoOpts);
  } catch (err: any) {
    const safeUri = env.MONGO_URI.replace(/:\/\/([^:]+):([^@]+)@/, (_m, user) => `://${user}:***@`);
    console.error("❌ Mongo connection failed.");
    console.error("URI:", safeUri);
    console.error("Error:", err?.message || err);
    throw err;
  }

  return mongoose;
}

export async function disconnectMongo() {
  if (isReady) {
    await mongoose.disconnect();
    isReady = false;
    console.log("🛑 MongoDB disconnected");
  }
}

process.on("SIGINT", async () => {
  await disconnectMongo();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnectMongo();
  process.exit(0);
});
