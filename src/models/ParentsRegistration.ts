import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { UserType } from "../../types/usertype";

export interface IParent extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  userType: UserType;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
  userType: {
    type: String,
    enum: ["driver", "parent", "admin", "teacher"],
    default: "parent",
  },
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

ParentSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Parent ||
  mongoose.model<IParent>("Parent", ParentSchema);
