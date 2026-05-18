export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";

/**
 * POST /api/auth/seed-admin
 *
 * Creates the first admin account (stored as a Parent document with
 * userType "admin"). Blocked once any admin already exists.
 *
 * Requires the request to include the ADMIN_SEED_SECRET header matching
 * the ADMIN_SEED_SECRET env var — prevents accidental or malicious use.
 *
 * Body: { email, password, fullName, phoneNumber }
 */
export async function POST(req: NextRequest) {
  const seedSecret = process.env.ADMIN_SEED_SECRET;
  if (!seedSecret) {
    return NextResponse.json(
      { success: false, message: "ADMIN_SEED_SECRET is not configured" },
      { status: 500 },
    );
  }

  const headerSecret = req.headers.get("x-seed-secret");
  if (headerSecret !== seedSecret) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  await dbConnect();

  // Block if an admin already exists in either collection
  const existing =
    (await Parent.findOne({ userType: "admin" })) ||
    (await Driver.findOne({ userType: "admin" }));

  if (existing) {
    return NextResponse.json(
      { success: false, message: "Admin account already exists" },
      { status: 409 },
    );
  }

  const { email, password, fullName, phoneNumber } = await req.json();

  if (!email || !password || !fullName || !phoneNumber) {
    return NextResponse.json(
      {
        success: false,
        message: "email, password, fullName and phoneNumber are required",
      },
      { status: 400 },
    );
  }

  // Store admin as a Parent document — lightweight, no driving-specific fields needed
  const admin = await Parent.create({
    email: email.toLowerCase(),
    password, // bcrypt hashed by pre-save hook
    fullName,
    phoneNumber,
    address: "Admin",
    userType: "admin",
    children: [],
  });

  const { password: _, ...safe } = admin.toObject();
  return NextResponse.json({ success: true, data: safe }, { status: 201 });
}
