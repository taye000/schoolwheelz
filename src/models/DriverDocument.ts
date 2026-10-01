import mongoose, { Document, Schema } from "mongoose";

export type DriverDocumentType = "idFront" | "idBack" | "license" | "goodConduct";

export interface IDriverDocument extends Document {
  driver: mongoose.Types.ObjectId;
  type: DriverDocumentType;
  fileName: string;
  mimeType: string;
  encryptedData: Buffer;
  iv: string;
  authTag: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverDocumentSchema = new Schema<IDriverDocument>(
  {
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    type: { type: String, enum: ["idFront", "idBack", "license", "goodConduct"], required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, enum: ["application/pdf", "image/jpeg", "image/png"], required: true },
    encryptedData: { type: Buffer, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { timestamps: true },
);

DriverDocumentSchema.index({ driver: 1, type: 1 }, { unique: true });

export default mongoose.models.DriverDocument ||
  mongoose.model<IDriverDocument>("DriverDocument", DriverDocumentSchema);