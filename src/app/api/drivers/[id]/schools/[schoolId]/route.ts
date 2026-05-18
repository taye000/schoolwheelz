export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";

/**
 * DELETE /api/drivers/[id]/schools/[schoolId]
 * Driver removes a school from their profile
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; schoolId: string } },
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

  if (!mongoose.Types.ObjectId.isValid(params.schoolId)) {
    return NextResponse.json(
      { success: false, message: "Invalid school ID" },
      { status: 400 },
    );
  }

  try {
    const result = await Driver.findByIdAndUpdate(
      params.id,
      { $pull: { schools: new mongoose.Types.ObjectId(params.schoolId) } },
      { new: true },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 },
      );
    }

    await result.populate("schools", "name estate");

    return NextResponse.json({ success: true, data: result.schools });
  } catch (err) {
    console.error("[DELETE /api/drivers/[id]/schools/[schoolId]]", err);
    return NextResponse.json(
      { success: false, message: "Failed to remove school" },
      { status: 500 },
    );
  }
}
