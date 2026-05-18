import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { UserType } from "../../types/usertype";

export interface ICar {
  _id?: mongoose.Types.ObjectId;
  make: string;
  model: string;
  regNumber: string;
  photo?: string;
  availableSeats: number;
  isActive: boolean;
}

export interface IDriver extends Document {
  fullName: string;
  dob: Date;
  licenseNumber: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  photo?: string;
  sex: string;
  userType: UserType;
  averageRating: number;
  ratingCount: number;
  password: string;
  /** New multi-car support */
  cars: ICar[];
  /** Admin has verified this driver's documents */
  isValidated: boolean;
  /** Visible to parents: true when validated AND has at least one active car */
  isProfileActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const CarSchema = new Schema<ICar>({
  make: { type: String, required: true },
  model: { type: String, required: true },
  regNumber: { type: String, required: true },
  photo: { type: String },
  availableSeats: { type: Number, required: true, min: 1, max: 20 },
  isActive: { type: Boolean, default: false },
});

const DriverSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  idNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phoneNumber: { type: String, required: true },
  photo: { type: String },
  sex: { type: String, required: true },
  cars: { type: [CarSchema], default: [] },
  isValidated: { type: Boolean, default: false },
  isProfileActive: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  userType: {
    type: String,
    enum: ["driver", "parent", "admin", "teacher"],
    default: "driver",
  },
  password: { type: String, required: true },
});

DriverSchema.pre<IDriver>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

DriverSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Driver ||
  mongoose.model<IDriver>("Driver", DriverSchema);
