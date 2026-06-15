import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/healthz", async (_req: Request, res: Response) => {
  let dbStatus = "ok";
  let dbError: unknown = null;
  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    dbStatus = "error";
    dbError = err;
    logger.error({ err }, "Database health check failed");
  }

  res.json({
    status: "ok",
    database: dbStatus,
    error: dbStatus === "error" ? "Check logs for details" : undefined,
    rawError: dbStatus === "error" ? { 
      message: dbError instanceof Error ? dbError.message : "Unknown error", 
      code: typeof dbError === "object" && dbError !== null && "code" in dbError ? (dbError as any).code : undefined 
    } : undefined,
    timestamp: new Date().toISOString()
  });
});

export default router;
