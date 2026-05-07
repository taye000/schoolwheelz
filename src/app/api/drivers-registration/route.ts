export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const driver = await Driver.create({
      ...body,
      userType: "driver",
    });
    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Registration failed." },
      { status: 400 }
    );
  }
}
