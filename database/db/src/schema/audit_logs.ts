import mongoose, { Document, Model, Schema } from "mongoose";
// @ts-ignore
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface AuditLog extends Document {
  id: number;
  userId?: number | null;
  action: string;
  entityId?: number | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLog>({
  id: { type: Number, unique: true },
  userId: { type: Number },
  action: { type: String, required: true },
  entityId: { type: Number },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now }
});

auditLogSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'audit_logs_id_counter' });

export const AuditLogModel: Model<AuditLog> = mongoose.models?.AuditLog || mongoose.model<AuditLog>("AuditLog", auditLogSchema);
export const auditLogsTable = AuditLogModel;
