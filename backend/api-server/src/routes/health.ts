import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus = "ok";
  let dbError: any = null;
  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    dbStatus = "error";
    dbError = err;
    logger.error({ err }, "Database health check failed");
  }

  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({
    ...data,
    database: dbStatus,
    error: dbStatus === "error" ? "Check logs for details" : undefined,
    rawError: dbStatus === "error" ? { message: dbError.message, code: dbError.code } : undefined,
    timestamp: new Date().toISOString()
  });
});

export default router;
