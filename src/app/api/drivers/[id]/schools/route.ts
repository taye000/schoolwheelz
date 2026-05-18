export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";

/**
 * POST /api/drivers/[id]/schools
 * Driver adds an approved school to their profile
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "driver" || user.id !== params.id) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 403 },
    );
  }

  const { schoolId } = await req.json();
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    return NextResponse.json(
      { success: false, message: "Valid schoolId required" },
      { status: 400 },
    );
  }

  try {
    const school = await School.findOne({ _id: schoolId, status: "approved" });
    if (!school) {
      return NextResponse.json(
        { success: false, message: "School not found or not approved" },
        { status: 404 },
      );
    }

    const result = await Driver.findByIdAndUpdate(
      params.id,
      { $addToSet: { schools: new mongoose.Types.ObjectId(schoolId) } },
      { new: true },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 },
      );
    }

    // Populate in a separate step for reliability
    await result.populate("schools", "name estate");

    return NextResponse.json({ success: true, data: result.schools });
  } catch (err) {
    console.error("[POST /api/drivers/[id]/schools]", err);
    return NextResponse.json(
      { success: false, message: "Failed to add school" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/drivers/[id]/schools
 * Returns a driver's school list (populated)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  try {
    const driver = await Driver.findById(params.id).populate(
      "schools",
      "name estate",
    );
    if (!driver) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: driver.schools });
  } catch (err) {
    console.error("[GET /api/drivers/[id]/schools]", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch schools" },
      { status: 500 },
    );
  }
}
