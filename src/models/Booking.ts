import mongoose, { Schema, Document } from "mongoose";
import { IChild } from "../../types/usertype";

export interface IBooking extends Document {
  driver: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  children: IChild[];
  seatsBooked: number;
  status: "pending" | "accepted" | "completed" | "canceled";
  tripDate: Date;
}

const ChildSchema: Schema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  school: { type: String, required: true },
  gender: { type: String, required: true },
});

const BookingSchema: Schema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    children: [{ type: ChildSchema, required: true }],
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
