export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";

export async function GET() {
  await dbConnect();
  try {
    const parents = await Parent.find({}).select("-password");
    return NextResponse.json({ success: true, data: parents });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch parents." },
      { status: 500 }
    );
  }
}
