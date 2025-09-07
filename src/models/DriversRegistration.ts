import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IDriver extends Document {
  fullName: string;
  dob: Date;
  licenseNumber: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  photo: string;
  sex: string;
  carMake: string;
  carModel: string;
  carRegNumber: string;
  carPhoto: string;
  password: string;
}

const DriverSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  idNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  photo: { type: String, required: true },
  sex: { type: String, required: true },
  carMake: { type: String, required: true },
  carModel: { type: String, required: true },
  carRegNumber: { type: String, required: true, unique: true },
  carPhoto: { type: String, required: true },
  password: { type: String, required: true },
});

DriverSchema.pre<IDriver>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.models.Driver ||
  mongoose.model<IDriver>("Driver", DriverSchema);
