import mongoose, { Schema, Document } from "mongoose";
import { IChild } from "../../types/usertype";

export type BookingType = "one_time" | "recurring";
export type TripDirection = "morning" | "evening" | "both";
export type BookingStatus =
  | "pending"
  | "driver_assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "canceled";

export interface IBookedChild {
  childRef?: mongoose.Types.ObjectId; // ref to parent.children subdoc _id
  name: string;
  age: number;
  school: string;
  gender: string;
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
  guardianNotes?: string; // e.g. "Ring doorbell, wait 2 mins"
  pickedUp?: boolean;
  droppedOff?: boolean;
  pickupTime?: Date;
  dropoffTime?: Date;
  /** Driver's post-trip note/rating for this child */
  driverNote?: string;
  driverRating?: number; // 1-5
}

export interface IBooking extends Document {
  bookingId: string;
  bookingType: BookingType;
  /** Link to Schedule if this trip was auto-generated */
  schedule?: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  children: IBookedChild[];
  /** Ordered list of child _ids for pickup sequence */
  pickupOrder: mongoose.Types.ObjectId[];
  seatsBooked: number;
  direction: TripDirection;
  status: BookingStatus;
  tripDate: Date;
  /** Driver arrived at pickup point */
  arrivedAt?: Date;
  /** Evening return time for one-time bookings with direction === "both", stored as "HH:MM" */
  returnTime?: string;
  recurringMeta?: {
    days: string[];
    startDate: string;
    endDate?: string | null;
    morningTime: string;
    eveningTime?: string | null;
  };
  isDeleted: boolean;
  tracking?: {
    currentLocation?: {
      type: "Point";
      coordinates: [number, number];
    };
    isTrackingEnabled: boolean;
    lastUpdated?: Date;
  };
}

const BookedChildSchema = new Schema(
  {
    childRef: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    school: { type: String, required: true },
    gender: { type: String, required: true },
    pickupLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    dropoffLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    guardianNotes: { type: String },
    pickedUp: { type: Boolean, default: false },
    droppedOff: { type: Boolean, default: false },
    pickupTime: { type: Date },
    dropoffTime: { type: Date },
    driverNote: { type: String },
    driverRating: { type: Number, min: 1, max: 5 },
  },
  { _id: true },
);

const BookingSchema: Schema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    bookingType: {
      type: String,
      enum: ["one_time", "recurring"],
      default: "one_time",
    },
    schedule: { type: Schema.Types.ObjectId, ref: "Schedule" },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    children: { type: [BookedChildSchema], required: true },
    pickupOrder: { type: [Schema.Types.ObjectId], default: [] },
    seatsBooked: { type: Number, required: true },
    direction: {
      type: String,
      enum: ["morning", "evening", "both"],
      default: "morning",
    },
    isDeleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "pending",
        "driver_assigned",
        "accepted",
        "in_progress",
        "completed",
        "canceled",
      ],
      default: "pending",
    },
    tripDate: { type: Date, required: true },
    arrivedAt: { type: Date, default: null },
    returnTime: { type: String, default: null },
    recurringMeta: {
      days: { type: [String], default: undefined },
      startDate: { type: String },
      endDate: { type: String, default: null },
      morningTime: { type: String },
      eveningTime: { type: String, default: null },
    },
    tracking: {
      currentLocation: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: { type: [Number], default: [0, 0] },
      },
      isTrackingEnabled: { type: Boolean, default: false },
      lastUpdated: { type: Date },
    },
  },
  { timestamps: true },
);

BookingSchema.index({ "tracking.currentLocation": "2dsphere" });
BookingSchema.index({ parent: 1, tripDate: -1 });
BookingSchema.index({ driver: 1, tripDate: -1, status: 1 });

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
