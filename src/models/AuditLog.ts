import mongoose, { Schema, Document } from "mongoose";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "login"
  | "logout"
  | "payment_update";

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  actorType: "driver" | "parent" | "admin";
  actorName: string;
  action: AuditAction;
  resource: string; // e.g. "Booking", "Driver", "School", "Bill"
  resourceId: string;
  detail?: string; // human-readable description of what changed
  meta?: Record<string, unknown>; // optional structured payload
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, required: true },
    actorType: {
      type: String,
      enum: ["driver", "parent", "admin"],
      required: true,
    },
    actorName: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "status_change",
        "login",
        "logout",
        "payment_update",
      ],
      required: true,
    },
    resource: { type: String, required: true },
    resourceId: { type: String, required: true },
    detail: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
