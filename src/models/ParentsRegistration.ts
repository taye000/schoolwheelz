import mongoose, { Schema, Document } from "mongoose";

export interface IParent extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  children: Array<{
    name: string;
    age: number;
    grade: string;
  }>;
}

const ParentSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  children: [
    {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      grade: { type: String, required: true },
    },
  ],
});

export default mongoose.models.Parent ||
  mongoose.model<IParent>("Parent", ParentSchema);
