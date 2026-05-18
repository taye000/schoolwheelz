export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const { password, userType } = body;
    const email = body.email.toLowerCase();

    if (!["parent", "driver", "admin"].includes(userType)) {
      return NextResponse.json(
        { success: false, message: "Invalid user type" },
        { status: 400 },
      );
    }

    // Admins may be stored in either collection — search both
    let user: any = null;
    if (userType === "admin") {
      user =
        (await Parent.findOne({ email, userType: "admin" })) ??
        (await Driver.findOne({ email, userType: "admin" }));
    } else {
      const Model = userType === "parent" ? Parent : Driver;
      user = await Model.findOne({ email });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    const { password: _, ...safeUser } = user.toObject();

    const res = NextResponse.json({ success: true, data: safeUser });
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
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
