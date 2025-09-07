import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IParent extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
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
  password: { type: String, required: true },
});

ParentSchema.pre<IParent>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.models.Parent ||
  mongoose.model<IParent>("Parent", ParentSchema);
