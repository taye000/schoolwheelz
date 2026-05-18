export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();

  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid driver ID." },
      { status: 400 },
    );
  }

  try {
    const driver = await Driver.findById(id).select("-password");
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch driver." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();

  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid driver ID." },
      { status: 400 },
    );
  }

  // Only the owner or an admin can update
  if (user.id !== id && user.userType !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    // Strip fields that must not be updated via this endpoint
    const {
      password,
      email,
      userType,
      _id,
      __v,
      cars,
      isValidated,
      isProfileActive,
      ...safeUpdate
    } = body;

    const driver = await Driver.findByIdAndUpdate(
      id,
      { $set: safeUpdate },
      { new: true, runValidators: true },
    ).select("-password");

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to update driver." },
      { status: 500 },
    );
  }
}
