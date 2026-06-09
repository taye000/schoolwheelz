import mongoose, { Schema, Document } from "mongoose";

export type SmsStatus = "sent" | "failed";

export interface ISmsLog extends Document {
  /** E.164 recipient number(s) */
  to: string[];
  /** Full message body sent */
  message: string;
  /** Outcome of the send attempt */
  status: SmsStatus;
  /** Provider-assigned message ID (TalkSasa) */
  providerMessageId?: string;
  /** Error message if send failed */
  error?: string;
  /** Logical event that triggered this SMS, e.g. "booking_accepted" */
  eventType?: string;
  /** Booking._id string if this SMS relates to a booking */
  bookingId?: string;
  /** User._id string of the account whose action triggered this SMS (null = system) */
  triggeredBy?: string;
  createdAt: Date;
}

const SmsLogSchema = new Schema<ISmsLog>(
  {
    to: { type: [String], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    providerMessageId: { type: String },
    error: { type: String },
    eventType: { type: String },
    bookingId: { type: String },
    triggeredBy: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SmsLogSchema.index({ createdAt: -1 });
SmsLogSchema.index({ status: 1, createdAt: -1 });
SmsLogSchema.index({ bookingId: 1 });

export default mongoose.models.SmsLog ||
  mongoose.model<ISmsLog>("SmsLog", SmsLogSchema);
