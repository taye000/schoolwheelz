export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";

function getTokenPayload(
  req: NextRequest,
): { id: string; userType: string } | null {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      userType: string;
    };
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const decoded = getTokenPayload(req);
  if (!decoded || decoded.userType !== "parent" || decoded.id !== params.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const parent = await Parent.findById(params.id).select("-password");
    if (!parent)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: parent });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const decoded = getTokenPayload(req);
  if (!decoded || decoded.userType !== "parent" || decoded.id !== params.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();

    // Strip fields that must not be updated this way
    const { password, email, userType, _id, __v, ...safeUpdate } = body;

    const updated = await Parent.findByIdAndUpdate(
      params.id,
      { $set: safeUpdate },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500 },
    );
  }
}
