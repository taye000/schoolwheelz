import mongoose, { Document, Schema } from "mongoose";

export interface IPublicHoliday extends Document {
  name: string;
  date: string;
  school?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PublicHolidaySchema = new Schema<IPublicHoliday>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    school: { type: Schema.Types.ObjectId, ref: "School", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
  },
  { timestamps: true },
);

PublicHolidaySchema.index({ date: 1, school: 1 });

export default mongoose.models.PublicHoliday ||
  mongoose.model<IPublicHoliday>("PublicHoliday", PublicHolidaySchema);