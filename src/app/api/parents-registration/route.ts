export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const parent = await Parent.create({ ...body, userType: "parent" });

    // Auto-login: sign a JWT and set the httpOnly cookie
    const token = jwt.sign(
      {
        id: parent._id,
        userType: parent.userType,
        email: parent.email,
        fullName: parent.fullName,
        phoneNumber: parent.phoneNumber,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    const { password: _, ...safeParent } = parent.toObject();

    const res = NextResponse.json(
      { success: true, data: safeParent },
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
