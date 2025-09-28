// backend/src/config/db.ts
import mongoose from "mongoose";
import { getEnv } from "./env";

export async function connectMongo() {
  const { MONGO_URI } = getEnv();

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    // Hide credentials in logs
    const safe = MONGO_URI.replace(/:\/\/[^@]+@/, "://****:****@");
    console.error("❌ Mongo connection failed.");
    console.error("URI:", safe);
    console.error(err);
    process.exit(1);
  }

  mongoose.connection.on("error", (e) => {
    console.error("❌ MongoDB error:", e);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });
}
