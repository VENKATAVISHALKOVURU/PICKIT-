import { Router, type Request, type Response } from "express";
import { ShopModel, PricingConfigModel, UserModel, Shop } from "@workspace/db";
import { UpdateMyShopPricingBody, UpdateMyShopSettingsBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

const serializeShop = (shop: Shop) => ({
  id: shop.id,
  ownerId: shop.ownerId,
  name: shop.name,
  shopCode: shop.shopCode,
  address: shop.address ?? null,
  latitude: shop.latitude ?? null,
  longitude: shop.longitude ?? null,
  isOpen: shop.isOpen,
});

// Haversine distance in metres
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

router.get("/shop/my", requireAuth, requireRole("owner"), async (req: Request, res: Response): Promise<void> => {
  const shop = await ShopModel.findOne({ ownerId: req.user!.userId });
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }
  res.json(serializeShop(shop));
});

router.get("/shop/nearby", async (req: Request, res: Response): Promise<void> => {
  const lat = parseFloat(String(req.query.lat ?? ""));
  const lng = parseFloat(String(req.query.lng ?? ""));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10));
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  const rows = await ShopModel.find({
    latitude: { $ne: null },
    longitude: { $ne: null }
  });

  const items = rows.map((s) => {
    const distance = hasCoords && s.latitude != null && s.longitude != null
      ? distanceMeters(lat, lng, Number(s.latitude), Number(s.longitude))
      : null;
    return { ...serializeShop(s), distanceMeters: distance };
  });

  items.sort((a, b) => {
    if (a.distanceMeters == null && b.distanceMeters == null) return 0;
    if (a.distanceMeters == null) return 1;
    if (b.distanceMeters == null) return -1;
    return a.distanceMeters - b.distanceMeters;
  });

  res.json({ shops: items.slice(0, limit), origin: hasCoords ? { lat, lng } : null });
});

router.get("/shop/my/pricing", requireAuth, requireRole("owner"), async (req: Request, res: Response): Promise<void> => {
  const shop = await ShopModel.findOne({ ownerId: req.user!.userId });
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  const pricing = await PricingConfigModel.findOne({ shopId: shop.id });
  if (!pricing) {
    res.status(404).json({ error: "Pricing config not found" });
    return;
  }

  res.json({
    id: pricing.id,
    shopId: pricing.shopId,
    bwPerPage: pricing.bwPerPage,
    colorPerPage: pricing.colorPerPage,
    minimumOrder: pricing.minimumOrder,
  });
});

router.put("/shop/my/pricing", requireAuth, requireRole("owner"), async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateMyShopPricingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shop = await ShopModel.findOne({ ownerId: req.user!.userId });
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  const pricing = await PricingConfigModel.findOneAndUpdate(
    { shopId: shop.id },
    {
      bwPerPage: parsed.data.bwPerPage,
      colorPerPage: parsed.data.colorPerPage,
      minimumOrder: parsed.data.minimumOrder,
    },
    { new: true }
  );

  res.json({
    id: pricing?.id,
    shopId: pricing?.shopId,
    bwPerPage: pricing?.bwPerPage,
    colorPerPage: pricing?.colorPerPage,
    minimumOrder: pricing?.minimumOrder,
  });
});

router.put("/shop/my/settings", requireAuth, requireRole("owner"), async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateMyShopSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shop = await ShopModel.findOne({ ownerId: req.user!.userId });
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  const updateData: any = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.isOpen !== undefined) updateData.isOpen = parsed.data.isOpen;
  
  const body = req.body as Record<string, unknown> | null;
  const rawLat = body?.latitude;
  const rawLng = body?.longitude;
  if (typeof rawLat === "number") updateData.latitude = rawLat;
  if (typeof rawLng === "number") updateData.longitude = rawLng;
  if (rawLat === null) updateData.latitude = null;
  if (rawLng === null) updateData.longitude = null;

  const updated = await ShopModel.findOneAndUpdate(
    { id: shop.id },
    updateData,
    { new: true }
  );

  res.json(serializeShop(updated!));
});

router.get("/shop/pricing/:shopId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
  const shopId = parseInt(raw, 10);
  if (isNaN(shopId)) {
    res.status(400).json({ error: "Invalid shopId" });
    return;
  }

  const pricing = await PricingConfigModel.findOne({ shopId });
  if (!pricing) {
    res.json({ id: 0, shopId, bwPerPage: 2, colorPerPage: 5, minimumOrder: 10 });
    return;
  }

  res.json({
    id: pricing.id,
    shopId: pricing.shopId,
    bwPerPage: pricing.bwPerPage,
    colorPerPage: pricing.colorPerPage,
    minimumOrder: pricing.minimumOrder,
  });
});

router.post("/shop/join/:shopCode", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const shopCode = Array.isArray(req.params.shopCode) ? req.params.shopCode[0] : req.params.shopCode;

  const shop = await ShopModel.findOne({ shopCode });
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  await UserModel.findOneAndUpdate(
    { id: req.user!.userId },
    { shopId: shop.id }
  );

  res.json(serializeShop(shop));
});

router.get("/shop/info/:shopCode", async (req: Request, res: Response): Promise<void> => {
  const shopCode = Array.isArray(req.params.shopCode) ? req.params.shopCode[0] : req.params.shopCode;

  const shop = await ShopModel.findOne({ shopCode });
  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  res.json(serializeShop(shop));
});

export default router;
