export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import "@/models/School"; // ensure School model is registered for populate

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const schoolId = searchParams.get("school"); // filter by school ObjectId
    const q = searchParams.get("q")?.trim(); // free-text: driver name or estate

    const filter: Record<string, unknown> = { isProfileActive: true };
    if (schoolId) filter.schools = schoolId;
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { estate: { $regex: q, $options: "i" } },
      ];
    }

    const drivers = await Driver.find(filter)
      .populate("schools", "name estate")
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Driver.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: drivers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch drivers." },
      { status: 500 },
    );
  }
}
