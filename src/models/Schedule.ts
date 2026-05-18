import mongoose, { Schema, Document } from "mongoose";

/**
 * A recurring transport schedule.
 * Represents a parent's subscription for daily school transport.
 * The system (or a cron job) generates individual Booking documents
 * from active schedules each school day.
 */

export type ScheduleStatus = "active" | "paused" | "cancelled";
export type TripDirection = "morning" | "evening" | "both";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface IScheduledChild {
  childRef: mongoose.Types.ObjectId;
  name: string;
  school: string;
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
  guardianNotes?: string;
}

export interface ISchedule extends Document {
  parent: mongoose.Types.ObjectId;
  /** Preferred driver — if null, system assigns any available driver */
  preferredDriver?: mongoose.Types.ObjectId;
  children: IScheduledChild[];
  /** Which days of the week this schedule runs */
  days: string[];
  direction: TripDirection;
  /** Term/academic period start and end (null = indefinite) */
  startDate?: Date;
  endDate?: Date;
  status: ScheduleStatus;
  /** Number of active trip instances generated from this schedule */
  tripsGenerated: number;
  notes?: string;
}

const ScheduledChildSchema = new Schema(
  {
    childRef: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    school: { type: String, required: true },
    pickupLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    dropoffLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    guardianNotes: { type: String },
  },
  { _id: false },
);

const ScheduleSchema: Schema = new Schema(
  {
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    preferredDriver: { type: Schema.Types.ObjectId, ref: "Driver" },
    children: { type: [ScheduledChildSchema], required: true },
    days: {
      type: [String],
      enum: DAYS,
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    direction: {
      type: String,
      enum: ["morning", "evening", "both"],
      default: "both",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },
    tripsGenerated: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

ScheduleSchema.index({ parent: 1, status: 1 });
ScheduleSchema.index({ preferredDriver: 1, status: 1 });

export default mongoose.models.Schedule ||
  mongoose.model<ISchedule>("Schedule", ScheduleSchema);
