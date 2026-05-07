export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
