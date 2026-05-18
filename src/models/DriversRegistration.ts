import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { UserType } from "../../types/usertype";

/* ── Sub-document interfaces ── */

export interface ICar {
  _id?: mongoose.Types.ObjectId;
  vehicleType: string; // e.g. Saloon, SUV, Van, Minibus
  make: string;
  model: string;
  year?: number;
  color?: string;
  regNumber: string;
  photo?: string;
  availableSeats: number;
  isActive: boolean;
  /** Document URLs uploaded by driver, reviewed by admin */
  documents?: {
    logbook?: string;
    insurance?: string;
    inspectionCert?: string;
    psvBadge?: string;
  };
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IDriverDocuments {
  idFront?: string;
  idBack?: string;
  licenseFront?: string;
  selfie?: string;
  goodConductCert?: string;
}

export interface IAvailability {
  days: string[]; // ["Monday","Tuesday",...]
  morning: boolean;
  evening: boolean;
  areasServed: string[]; // ["Westlands","Karen",...]
  schoolsServed: string[]; // school names
}

export interface IDriverLocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";
export type LiveStatus = "offline" | "online" | "on_trip" | "unavailable";

/* ── Main driver interface ── */

export interface IDriver extends Document {
  /* Basic */
  fullName: string;
  dob: Date;
  email: string;
  phoneNumber: string;
  photo?: string;
  sex: string;
  password: string;
  userType: UserType;

  /* Address */
  address?: string;
  city?: string;
  county?: string;

  /* Identity */
  idNumber: string;
  licenseNumber: string;
  licenseExpiry?: Date;
  documents?: IDriverDocuments;

  /* Emergency contact */
  emergencyContact?: IEmergencyContact;

  /* Verification */
  verificationStatus: VerificationStatus;
  /** Deprecated: kept for backward compat — mirrors verificationStatus === "approved" */
  isValidated: boolean;
  /** Visible to parents: approved + has active car */
  isProfileActive: boolean;
  verificationNotes?: string; // admin can leave a reason on rejection

  /* Vehicles */
  cars: ICar[];

  /* Schools served (references to approved School documents) */
  schools: mongoose.Types.ObjectId[];

  /* Availability */
  availability?: IAvailability;

  /* Live presence */
  liveStatus: LiveStatus;
  lastLocation?: IDriverLocation;
  lastActiveAt?: Date;

  /* Performance metrics (denormalized counters) */
  averageRating: number;
  ratingCount: number;
  totalTrips: number;
  completedTrips: number;
  cancellations: number;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

/* ── Schemas ── */

const CarDocSchema = new Schema(
  {
    logbook: { type: String },
    insurance: { type: String },
    inspectionCert: { type: String },
    psvBadge: { type: String },
  },
  { _id: false },
);

const CarSchema = new Schema<ICar>({
  vehicleType: { type: String, default: "Saloon" },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number },
  color: { type: String },
  regNumber: { type: String, required: true },
  photo: { type: String },
  availableSeats: { type: Number, required: true, min: 1, max: 30 },
  isActive: { type: Boolean, default: false },
  documents: { type: CarDocSchema },
});

const EmergencyContactSchema = new Schema(
  {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
  },
  { _id: false },
);

const DriverDocumentsSchema = new Schema(
  {
    idFront: { type: String },
    idBack: { type: String },
    licenseFront: { type: String },
    selfie: { type: String },
    goodConductCert: { type: String },
  },
  { _id: false },
);

const AvailabilitySchema = new Schema(
  {
    days: { type: [String], default: [] },
    morning: { type: Boolean, default: true },
    evening: { type: Boolean, default: true },
    areasServed: { type: [String], default: [] },
    schoolsServed: { type: [String], default: [] },
  },
  { _id: false },
);

const DriverSchema: Schema = new Schema(
  {
    /* Basic */
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true },
    photo: { type: String },
    sex: { type: String, required: true },
    password: { type: String, required: true },
    userType: {
      type: String,
      enum: ["driver", "parent", "admin", "teacher"],
      default: "driver",
    },

    /* Address */
    address: { type: String },
    city: { type: String },
    county: { type: String },

    /* Identity */
    idNumber: { type: String, required: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true },
    licenseExpiry: { type: Date },
    documents: { type: DriverDocumentsSchema },

    /* Emergency contact */
    emergencyContact: { type: EmergencyContactSchema },

    /* Verification */
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    isValidated: { type: Boolean, default: false }, // kept for compat
    isProfileActive: { type: Boolean, default: false },
    verificationNotes: { type: String },

    /* Vehicles */
    cars: { type: [CarSchema], default: [] },

    /* Schools served */
    schools: [{ type: Schema.Types.ObjectId, ref: "School" }],

    /* Availability */
    availability: { type: AvailabilitySchema },

    /* Live presence */
    liveStatus: {
      type: String,
      enum: ["offline", "online", "on_trip", "unavailable"],
      default: "offline",
    },
    lastLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: { type: [Number] },
    },
    lastActiveAt: { type: Date },

    /* Performance */
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancellations: { type: Number, default: 0 },
  },
  { timestamps: true },
);

/* 2dsphere index for geo queries — sparse so docs without coordinates are skipped */
DriverSchema.index({ lastLocation: "2dsphere" }, { sparse: true });

/* Keep isValidated in sync with verificationStatus */
DriverSchema.pre<IDriver>("save", async function (next) {
  if (this.isModified("verificationStatus")) {
    this.isValidated = this.verificationStatus === "approved";
    // Revoke profile visibility if no longer approved
    if (this.verificationStatus !== "approved") {
      this.isProfileActive = false;
    }
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

DriverSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Driver ||
  mongoose.model<IDriver>("Driver", DriverSchema);
