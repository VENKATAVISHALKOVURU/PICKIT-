import mongoose, { Document, Model, Schema } from "mongoose";
// @ts-ignore
import AutoIncrementFactory from "mongoose-sequence";
import { z } from "zod/v4";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface Order extends Document {
  id: number;
  studentId: number;
  shopId: number;
  fileUrl: string;
  fileName: string;
  pages: number;
  colorMode: string;
  copies: number;
  status: string;
  price: number;
  note?: string | null;
  createdAt: Date;
}

const orderSchema = new Schema<Order>({
  id: { type: Number, unique: true },
  studentId: { type: Number, required: true },
  shopId: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  pages: { type: Number, required: true },
  colorMode: { type: String, required: true },
  copies: { type: Number, required: true },
  status: { type: String, required: true, default: "pending" },
  price: { type: Number, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

orderSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'orders_id_counter' });

export const OrderModel: Model<Order> = mongoose.models?.Order || mongoose.model<Order>("Order", orderSchema);
export const ordersTable = OrderModel; // Keep this exported

export const insertOrderSchema = z.object({
  studentId: z.number(),
  shopId: z.number(),
  fileUrl: z.string(),
  fileName: z.string(),
  pages: z.number(),
  colorMode: z.string(),
  copies: z.number(),
  price: z.number(),
  note: z.string().optional().nullable(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
