import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  driver: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[]; // Or just an array of {name, age} if needed
  seatsBooked: number;
  status: "pending" | "accepted" | "completed" | "canceled";
  tripDate: Date;
}

const BookingSchema: Schema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    children: [{ type: Schema.Types.ObjectId, ref: "Child", required: true }],
    seatsBooked: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "canceled"],
      default: "pending",
    },
    tripDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
