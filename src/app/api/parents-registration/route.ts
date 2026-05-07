export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const parent = await Parent.create({
      ...body,
      userType: "parent",
    });
    return NextResponse.json({ success: true, data: parent }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Registration failed." },
      { status: 400 }
    );
  }
}
