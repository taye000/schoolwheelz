export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";

/**
 * GET /api/schools
 * Public: returns all approved schools (for dropdowns, homepage, search)
 * Admin: ?status=pending|rejected|all returns all
 */
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // only respected if admin
  const search = searchParams.get("q") ?? "";

  // Check if caller is admin (optional — unauthenticated gets approved only)
  let isAdmin = false;
  try {
    const user = getAuthUser(req);
    if (!(user instanceof NextResponse) && user.userType === "admin") {
      isAdmin = true;
    }
  } catch {}

  const filter: Record<string, unknown> = {};

  if (isAdmin && status && status !== "approved") {
    filter.status =
      status === "all" ? { $in: ["approved", "pending", "rejected"] } : status;
  } else {
    filter.status = "approved";
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { estate: { $regex: search, $options: "i" } },
    ];
  }

  const schools = await School.find(filter)
    .populate("requestedBy", "fullName email")
    .sort({ name: 1 });

  return NextResponse.json({ success: true, data: schools });
}

/**
 * POST /api/schools
 * Admin only: create a pre-approved school directly
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin only" },
      { status: 403 },
    );
  }

  const { name, estate, coordinates } = await req.json();
  if (!name || !estate) {
    return NextResponse.json(
      { success: false, message: "name and estate are required" },
      { status: 400 },
    );
  }

  const school = await School.create({
    name: name.trim(),
    estate: estate.trim(),
    location: {
      type: "Point",
      coordinates: coordinates ?? [36.8219, -1.2921],
    },
    status: "approved",
  });

  return NextResponse.json({ success: true, data: school }, { status: 201 });
}
