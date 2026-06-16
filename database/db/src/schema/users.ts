import mongoose, { Document, Model, Schema } from "mongoose";
// @ts-ignore
import AutoIncrementFactory from "mongoose-sequence";
import { z } from "zod";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface User extends Document {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  shopId?: number | null;
  createdAt: Date;
}

const userSchema = new Schema<User>({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  shopId: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

userSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'users_id_counter' });

export const UserModel: Model<User> = mongoose.models?.User || mongoose.model<User>("User", userSchema);
export const usersTable = UserModel; // Keep this exported to minimize route changes

export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.string(),
  shopId: z.number().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
