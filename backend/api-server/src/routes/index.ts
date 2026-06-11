import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import shopRouter from "./shop.js";
import ordersRouter from "./orders.js";
import analyticsRouter from "./analytics.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(shopRouter);
router.use(ordersRouter);
router.use(analyticsRouter);

export default router;
