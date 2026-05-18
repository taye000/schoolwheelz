import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  driver: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  rating: number; // 1–5 stars
  comment?: string;
  complaints?: string[]; // e.g. ["Late arrival", "Reckless driving"]
}

const ReviewSchema: Schema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    complaints: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
