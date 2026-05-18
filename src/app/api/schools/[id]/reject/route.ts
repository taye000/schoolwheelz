export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";

/**
 * PATCH /api/schools/[id]/reject
 * Admin only: reject a pending school request
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin only" },
      { status: 403 },
    );
  }

  const { adminNote } = await req.json().catch(() => ({}));

  const school = await School.findByIdAndUpdate(
    params.id,
    { status: "rejected", adminNote: adminNote ?? "" },
    { new: true },
  );
  if (!school) {
    return NextResponse.json(
      { success: false, message: "School not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: school });
}

/**
 * DELETE /api/schools/[id]/reject — admin deletes a school entirely
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin only" },
      { status: 403 },
    );
  }

  await School.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
