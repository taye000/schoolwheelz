import mongoose, { Mongoose } from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

const opts = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

let cached: { conn: Mongoose | null; promise: Promise<Mongoose> | null };

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the connection
  // isn't wiped out during Next.js hot-reloads.
  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }
  cached = global.mongoose;
} else {
  // In production (Vercel), cache in module scope across
  // serverless function invocations in the same instance.
  cached = { conn: null, promise: null };
}

async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
