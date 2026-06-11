import express, { Request, Response } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const app = express();

// 1. Security Headers (The Shield)
app.use(helmet());

// 2. Rate Limiting (The Sentry) - Prevents brute force and DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/", limiter);

// 3. Logging (The Watchtower)
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// 4. Hardened CORS (The Drawbridge)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3002"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "10kb" })); // Body size limit to prevent overflow
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "PickIT API is running",
    version: "1.0.0",
    docs: "/api/healthz"
  });
});

app.use("/api", router);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist. Try /api/healthz to check status."
  });
});

// Global Error Handler
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

export default app;
