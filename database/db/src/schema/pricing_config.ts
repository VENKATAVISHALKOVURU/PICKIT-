import mongoose, { Document, Model, Schema } from "mongoose";
// @ts-ignore
import AutoIncrementFactory from "mongoose-sequence";
import { z } from "zod/v4";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface PricingConfig extends Document {
  id: number;
  shopId: number;
  bwPerPage: number;
  colorPerPage: number;
  minimumOrder: number;
  updatedAt: Date;
}

const pricingConfigSchema = new Schema<PricingConfig>({
  id: { type: Number, unique: true },
  shopId: { type: Number, required: true, unique: true },
  bwPerPage: { type: Number, required: true, default: 2 },
  colorPerPage: { type: Number, required: true, default: 5 },
  minimumOrder: { type: Number, required: true, default: 10 },
  updatedAt: { type: Date, default: Date.now }
});

pricingConfigSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'pricing_config_id_counter' });

export const PricingConfigModel: Model<PricingConfig> = mongoose.models?.PricingConfig || mongoose.model<PricingConfig>("PricingConfig", pricingConfigSchema);
export const pricingConfigTable = PricingConfigModel;

export const insertPricingConfigSchema = z.object({
  shopId: z.number(),
  bwPerPage: z.number().optional().default(2),
  colorPerPage: z.number().optional().default(5),
  minimumOrder: z.number().optional().default(10),
});

export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
