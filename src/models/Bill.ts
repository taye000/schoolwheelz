import mongoose, { Schema, Document } from "mongoose";

export type BillStatus = "pending" | "paid" | "overdue" | "waived";
export type BillPeriod = "weekly" | "monthly";

export interface IBillLineItem {
  bookingId: mongoose.Types.ObjectId;
  bookingRef: string; // human-readable booking ID
  tripDate: Date;
  childName: string;
  direction: string;
  driverName: string;
  amount: number; // KES
}

export interface IBill extends Document {
  billRef: string; // e.g. "BILL-20260519-001"
  parent: mongoose.Types.ObjectId;
  parentName: string;
  periodStart: Date;
  periodEnd: Date;
  period: BillPeriod;
  lineItems: IBillLineItem[];
  subtotal: number;
  total: number; // admin can override
  status: BillStatus;
  paidAt?: Date;
  adminNote?: string;
  /** Admin who last touched this bill */
  lastEditedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<IBillLineItem>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    bookingRef: { type: String, required: true },
    tripDate: { type: Date, required: true },
    childName: { type: String, required: true },
    direction: { type: String, required: true },
    driverName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const BillSchema = new Schema<IBill>(
  {
    billRef: { type: String, required: true, unique: true },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    parentName: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    period: { type: String, enum: ["weekly", "monthly"], required: true },
    lineItems: { type: [LineItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "waived"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date, default: null },
    adminNote: { type: String },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "Parent" },
  },
  { timestamps: true },
);

BillSchema.index({ parent: 1, periodStart: -1 });
BillSchema.index({ status: 1, periodEnd: 1 });

export default mongoose.models.Bill ||
  mongoose.model<IBill>("Bill", BillSchema);
