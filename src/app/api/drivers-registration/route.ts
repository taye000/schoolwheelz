export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const driver = await Driver.create({ ...body, userType: "driver" });

    // Auto-login: sign JWT and set httpOnly cookie
    const token = jwt.sign(
      {
        id: driver._id,
        userType: driver.userType,
        email: driver.email,
        fullName: driver.fullName,
        phoneNumber: driver.phoneNumber,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    const { password: _, ...safeDriver } = driver.toObject();

    const res = NextResponse.json(
      { success: true, data: safeDriver },
      { status: 201 },
    );
    res.headers.set(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }),
    );
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Registration failed." },
      { status: 400 },
    );
  }
}
