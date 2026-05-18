export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    const drivers = await Driver.find({ isProfileActive: true })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Driver.countDocuments({ isProfileActive: true });

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
