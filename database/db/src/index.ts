import mongoose from "mongoose";
export * from "./schema/index.js";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is required but was not provided.");
}

console.log("[DB] Initializing MongoDB connection...");

mongoose.connect(dbUrl).then(() => {
    console.log("[DB] MongoDB connected successfully.");
}).catch((err) => {
    console.error("[DB] MongoDB connection error:", err);
});

export const db = mongoose.connection;
