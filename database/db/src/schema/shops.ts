import mongoose, { Document, Model, Schema } from "mongoose";
// @ts-ignore
import AutoIncrementFactory from "mongoose-sequence";
import { z } from "zod/v4";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface Shop extends Document {
  id: number;
  ownerId: number;
  name: string;
  shopCode: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOpen: boolean;
  createdAt: Date;
}

const shopSchema = new Schema<Shop>({
  id: { type: Number, unique: true },
  ownerId: { type: Number, required: true },
  name: { type: String, required: true },
  shopCode: { type: String, required: true, unique: true },
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  isOpen: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, default: Date.now }
});

shopSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'shops_id_counter' });

export const ShopModel: Model<Shop> = mongoose.models?.Shop || mongoose.model<Shop>("Shop", shopSchema);
export const shopsTable = ShopModel;

export const insertShopSchema = z.object({
  ownerId: z.number(),
  name: z.string(),
  shopCode: z.string(),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isOpen: z.boolean().optional().default(true),
});

export type InsertShop = z.infer<typeof insertShopSchema>;
