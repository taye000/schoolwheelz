import mongoose, { Schema, Document } from "mongoose";

export interface IContact extends Document {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  message: string;
  status: "new" | "replied";
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "replied"], default: "new" },
  },
  { timestamps: true },
);

export default mongoose.models.Contact ||
  mongoose.model<IContact>("Contact", ContactSchema);
