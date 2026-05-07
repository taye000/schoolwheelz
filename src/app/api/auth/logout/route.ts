export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out" });
  res.headers.set(
    "Set-Cookie",
    serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    })
  );
  return res;
}
