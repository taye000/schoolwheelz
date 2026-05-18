import mongoose, { Document, Schema } from "mongoose";

export type SchoolStatus = "approved" | "pending" | "rejected";

export interface ISchool extends Document {
  name: string;
  estate: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: SchoolStatus;
  requestedBy?: mongoose.Types.ObjectId; // driver who sent the request
  requestNote?: string; // optional note from driver on request
  adminNote?: string; // admin's edit / rejection note
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    estate: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [36.8219, -1.2921],
      },
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved", // admin-created schools are immediately approved
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    requestNote: { type: String, default: "" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

SchoolSchema.index({ location: "2dsphere" });
SchoolSchema.index({ status: 1 });
SchoolSchema.index({ name: 1 });

export default mongoose.models.School ||
  mongoose.model<ISchool>("School", SchoolSchema);
