import { pgTable, integer, doublePrecision, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const pricingConfigTable = pgTable("pricing_config", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().unique(),
  bwPerPage: doublePrecision("bw_per_page").notNull().default(2),
  colorPerPage: doublePrecision("color_per_page").notNull().default(5),
  minimumOrder: doublePrecision("minimum_order").notNull().default(10),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfigTable).omit({ id: true });
export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
export type PricingConfig = typeof pricingConfigTable.$inferSelect;
