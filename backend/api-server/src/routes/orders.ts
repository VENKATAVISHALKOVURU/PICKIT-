import { Router, type IRouter } from "express";
import { OrderModel, UserModel, ShopModel, PricingConfigModel } from "@workspace/db";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.post("/orders", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { shopId, fileUrl, fileName, pages, colorMode, copies, note } = parsed.data;

  const pricing = await PricingConfigModel.findOne({ shopId });
  const perPage = colorMode === "color" ? (pricing?.colorPerPage ?? 5) : (pricing?.bwPerPage ?? 2);
  const price = Math.max(pages * copies * perPage, pricing?.minimumOrder ?? 10);

  const order = await OrderModel.create({
    studentId: req.user!.userId,
    shopId,
    fileUrl,
    fileName,
    pages,
    colorMode,
    copies,
    status: "pending",
    price,
    note: note || null,
  });

  res.status(201).json({
    id: order.id,
    studentId: order.studentId,
    shopId: order.shopId,
    fileUrl: order.fileUrl,
    fileName: order.fileName,
    pages: order.pages,
    colorMode: order.colorMode,
    copies: order.copies,
    status: order.status,
    price: order.price,
    note: order.note ?? null,
    createdAt: order.createdAt.toISOString(),
    studentName: null,
  });
});

router.get("/orders/student", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const orders = await OrderModel.find({ studentId: req.user!.userId });

  res.json(orders.map(o => ({
    id: o.id,
    studentId: o.studentId,
    shopId: o.shopId,
    fileUrl: o.fileUrl,
    fileName: o.fileName,
    pages: o.pages,
    colorMode: o.colorMode,
    copies: o.copies,
    status: o.status,
    price: o.price,
    note: o.note ?? null,
    createdAt: o.createdAt.toISOString(),
    studentName: null,
  })));
});

router.get("/orders/shop", requireAuth, requireRole("owner"), async (req, res): Promise<void> => {
  const shop = await ShopModel.findOne({ ownerId: req.user!.userId });
  if (!shop) {
    res.json([]);
    return;
  }

  const orders = await OrderModel.find({ shopId: shop.id });

  const studentIds = [...new Set(orders.map(o => o.studentId))];
  const students = studentIds.length > 0
    ? await UserModel.find({ id: { $in: studentIds } }).select("id name")
    : [];

  const studentMap = new Map(students.map(s => [s.id, s.name]));

  res.json(orders.map(o => ({
    id: o.id,
    studentId: o.studentId,
    shopId: o.shopId,
    fileUrl: o.fileUrl,
    fileName: o.fileName,
    pages: o.pages,
    colorMode: o.colorMode,
    copies: o.copies,
    status: o.status,
    price: o.price,
    note: o.note ?? null,
    createdAt: o.createdAt.toISOString(),
    studentName: studentMap.get(o.studentId) ?? null,
  })));
});

router.patch("/orders/:id/status", requireAuth, requireRole("owner"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shop = await ShopModel.findOne({ ownerId: req.user!.userId });
  if (!shop) {
    res.status(403).json({ error: "No shop associated with this owner" });
    return;
  }

  const order = await OrderModel.findOneAndUpdate(
    { id, shopId: shop.id },
    { status: parsed.data.status },
    { new: true }
  );

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({
    id: order.id,
    studentId: order.studentId,
    shopId: order.shopId,
    fileUrl: order.fileUrl,
    fileName: order.fileName,
    pages: order.pages,
    colorMode: order.colorMode,
    copies: order.copies,
    status: order.status,
    price: order.price,
    note: order.note ?? null,
    createdAt: order.createdAt.toISOString(),
    studentName: null,
  });
});

export default router;
