import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
  | "booking_new" // driver: new booking request
  | "booking_accepted" // parent: driver accepted
  | "booking_rejected" // parent: driver rejected
  | "booking_cancelled" // driver or parent: other party cancelled
  | "trip_started" // parent: driver is on the way
  | "driver_arrived" // parent: driver at pickup
  | "trip_completed" // parent: trip done
  | "bill_generated" // parent: new bill ready
  | "bill_paid" // parent: bill marked paid
  | "driver_validated" // driver: account approved/rejected
  | "school_approved" // driver: school request approved
  | "school_rejected" // driver: school request rejected
  | "general";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  userType: "parent" | "driver" | "admin";
  type: NotificationType;
  title: string;
  body: string;
  /** Optional link to navigate to when tapped */
  href?: string;
  /** Related resource (booking, bill, etc.) */
  resourceId?: string;
  resourceType?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    userType: {
      type: String,
      enum: ["parent", "driver", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "booking_new",
        "booking_accepted",
        "booking_rejected",
        "booking_cancelled",
        "trip_started",
        "driver_arrived",
        "trip_completed",
        "bill_generated",
        "bill_paid",
        "driver_validated",
        "school_approved",
        "school_rejected",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String },
    resourceId: { type: String },
    resourceType: { type: String },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
