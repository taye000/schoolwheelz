import mongoose, { Document, Schema } from "mongoose";

export interface IInquiry extends Document {
  name: string;
  email?: string;
  phone?: string;
  school?: string;
  message: string;
  status: "new" | "resolved";
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, lowercase: true, maxlength: 254 },
    phone: { type: String, maxlength: 40 },
    school: { type: String, maxlength: 120 },
    message: { type: String, required: true, maxlength: 1500 },
    status: { type: String, enum: ["new", "resolved"], default: "new" },
  },
  { timestamps: true },
);

export default mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);