export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";
import "@/models/School"; // ensure School model is registered for populate

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    let decoded: { id: string; userType: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        userType: string;
      };
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    const Model =
      decoded.userType === "parent" || decoded.userType === "admin"
        ? Parent
        : decoded.userType === "driver"
          ? Driver
          : null;

    if (!Model) {
      return NextResponse.json(
        { success: false, message: "Invalid user type" },
        { status: 400 },
      );
    }

    const user =
      decoded.userType === "driver"
        ? await Driver.findById(decoded.id)
            .select("-password")
            .populate("schools", "name estate")
        : await Model.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
