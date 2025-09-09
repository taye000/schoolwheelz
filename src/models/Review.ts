import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  driver: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  rating: number; // 1–5 stars
  comment?: string;
}

const ReviewSchema: Schema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
