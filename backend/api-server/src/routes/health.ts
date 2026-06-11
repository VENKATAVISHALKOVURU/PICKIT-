import { Router } from "express";
import { db } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/healthz", async (_req: any, res: any) => {
  let dbStatus = "ok";
  let dbError: any = null;
  try {
    await db.execute("SELECT 1");
  } catch (err) {
    dbStatus = "error";
    dbError = err;
    logger.error({ err }, "Database health check failed");
  }

  res.json({
    status: "ok",
    database: dbStatus,
    error: dbStatus === "error" ? "Check logs for details" : undefined,
    rawError: dbStatus === "error" ? { message: dbError.message, code: dbError.code } : undefined,
    timestamp: new Date().toISOString()
  });
});

export default router;
