export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";

/**
 * POST /api/schools/request
 * Driver only: request a new school that isn't in the approved list yet
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "driver") {
    return NextResponse.json(
      { success: false, message: "Driver only" },
      { status: 403 },
    );
  }

  const { name, estate, coordinates, requestNote } = await req.json();
  if (!name || !estate) {
    return NextResponse.json(
      { success: false, message: "name and estate are required" },
      { status: 400 },
    );
  }

  // Prevent duplicate pending requests for same school name
  const existing = await School.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
    status: { $in: ["approved", "pending"] },
  });
  if (existing) {
    return NextResponse.json(
      {
        success: false,
        message:
          existing.status === "approved"
            ? "This school already exists in the approved list."
            : "A request for this school is already pending review.",
      },
      { status: 409 },
    );
  }

  const school = await School.create({
    name: name.trim(),
    estate: estate.trim(),
    location: {
      type: "Point",
      coordinates: coordinates ?? [36.8219, -1.2921],
    },
    status: "pending",
    requestedBy: user.id,
    requestNote: requestNote ?? "",
  });

  return NextResponse.json({ success: true, data: school }, { status: 201 });
}
