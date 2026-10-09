export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import PublicHoliday from "@/models/PublicHoliday";
import { getAuthUser } from "@/utils/authApp";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const schoolId = searchParams.get("schoolId");
  const filter: Record<string, unknown> = {};

  if ((from && !DATE_PATTERN.test(from)) || (to && !DATE_PATTERN.test(to))) {
    return NextResponse.json({ success: false, message: "Invalid date range." }, { status: 400 });
  }
  if (from || to) {
    filter.date = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }
  if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
    filter.school = { $in: [null, new mongoose.Types.ObjectId(schoolId)] };
  } else {
    const user = getAuthUser(req);
    if (user instanceof NextResponse || user.userType !== "admin") filter.school = null;
  }

  const holidays = await PublicHoliday.find(filter)
    .populate("school", "name")
    .sort({ date: 1, name: 1 })
    .lean();
  return NextResponse.json({ success: true, data: holidays });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json({ success: false, message: "Admin only." }, { status: 403 });
  }

  try {
    const { name, date, schoolId } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (!normalizedName || normalizedName.length > 120 || !DATE_PATTERN.test(date ?? "")) {
      return NextResponse.json({ success: false, message: "Enter a holiday name and valid date." }, { status: 400 });
    }
    if (schoolId && !mongoose.Types.ObjectId.isValid(schoolId)) {
      return NextResponse.json({ success: false, message: "Invalid school." }, { status: 400 });
    }
    const holiday = await PublicHoliday.create({
      name: normalizedName,
      date,
      school: schoolId || null,
      createdBy: user.id,
    });
    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Could not add holiday." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json({ success: false, message: "Admin only." }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Valid holiday ID required." }, { status: 400 });
  }
  const deleted = await PublicHoliday.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ success: false, message: "Holiday not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}