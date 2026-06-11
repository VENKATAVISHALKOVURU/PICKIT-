import { pgTable, text, integer, doublePrecision, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  shopId: integer("shop_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  pages: integer("pages").notNull(),
  colorMode: text("color_mode").notNull(),
  copies: integer("copies").notNull(),
  status: text("status").notNull().default("pending"),
  price: doublePrecision("price").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, status: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
