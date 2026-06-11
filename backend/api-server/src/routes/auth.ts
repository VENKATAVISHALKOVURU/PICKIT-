import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, shopsTable, pricingConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth, signToken } from "../middlewares/auth.js";
import { randomBytes } from "crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateShopCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `PK-${out.slice(0, 3)}${out.slice(3)}`;
}

async function generateUniqueShopCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateShopCode();
    const existing = await db.select().from(shopsTable).where(eq(shopsTable.shopCode, code));
    if (existing.length === 0) return code;
  }
  return `PK-${randomBytes(4).toString("hex").toUpperCase()}`;
}

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role, shopName, shopAddress } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    password: hashedPassword,
    role,
  }).returning();

  if (role === "owner") {
    const shopCode = await generateUniqueShopCode();
    const [shop] = await db.insert(shopsTable).values({
      ownerId: user.id,
      name: shopName || `${name}'s Print Shop`,
      shopCode,
      address: shopAddress || null,
      isOpen: true,
    }).returning();

    await db.insert(pricingConfigTable).values({
      shopId: shop.id,
      bwPerPage: 2,
      colorPerPage: 5,
      minimumOrder: 10,
    });
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId ?? null,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId ?? null,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopId: user.shopId ?? null,
  });
});

export default router;
