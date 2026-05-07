export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid driver ID." },
      { status: 400 }
    );
  }

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch driver." },
      { status: 500 }
    );
  }
}
