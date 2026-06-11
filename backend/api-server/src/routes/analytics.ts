import { Router, type IRouter } from "express";
import { db, ordersTable, usersTable, shopsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/analytics/overview", requireAuth, requireRole("owner"), async (req, res): Promise<void> => {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.user!.userId));
  if (!shop) {
    res.json({ totalOrders: 0, pendingOrders: 0, todayRevenue: 0, totalRevenue: 0, activeStudents: 0 });
    return;
  }

  const allOrders = await db.select().from(ordersTable).where(eq(ordersTable.shopId, shop.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === "pending" || o.status === "printing").length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.price, 0);
  const todayRevenue = allOrders
    .filter(o => new Date(o.createdAt) >= today)
    .reduce((sum, o) => sum + o.price, 0);

  const studentIds = [...new Set(allOrders.map(o => o.studentId))];
  const activeStudents = studentIds.length;

  res.json({ totalOrders, pendingOrders, todayRevenue, totalRevenue, activeStudents });
});

router.get("/analytics/orders-by-day", requireAuth, requireRole("owner"), async (req, res): Promise<void> => {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.user!.userId));
  if (!shop) {
    res.json([]);
    return;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const orders = await db.select().from(ordersTable).where(
    and(eq(ordersTable.shopId, shop.id), gte(ordersTable.createdAt, sevenDaysAgo))
  );

  const result: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = orders.filter(o => o.createdAt.toISOString().split("T")[0] === dateStr).length;
    result.push({ date: dateStr, count });
  }

  res.json(result);
});

router.get("/analytics/revenue-trend", requireAuth, requireRole("owner"), async (req, res): Promise<void> => {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.user!.userId));
  if (!shop) {
    res.json([]);
    return;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const orders = await db.select().from(ordersTable).where(
    and(eq(ordersTable.shopId, shop.id), gte(ordersTable.createdAt, sevenDaysAgo))
  );

  const result: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const revenue = orders
      .filter(o => o.createdAt.toISOString().split("T")[0] === dateStr)
      .reduce((sum, o) => sum + o.price, 0);
    result.push({ date: dateStr, revenue });
  }

  res.json(result);
});

export default router;
