export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";
import { log } from "@/utils/audit";
import { createNotification } from "@/utils/notify";

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

  log({
    actorId: user.id,
    actorType: "admin",
    actorName: user.fullName,
    action: "status_change",
    resource: "School",
    resourceId: params.id,
    detail: `School "${school.name}" rejected`,
  });

  if (school.requestedBy) {
    createNotification({
      userId: school.requestedBy.toString(),
      userType: "driver",
      type: "school_rejected",
      title: "School Request Rejected",
      body: `Your school request for "${school.name}" was not approved${adminNote ? ": " + adminNote : "."}`,
      href: "/profile",
      resourceId: params.id,
      resourceType: "school",
    });
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

  const school = await School.findByIdAndDelete(params.id);

  if (school) {
    log({
      actorId: user.id,
      actorType: "admin",
      actorName: user.fullName,
      action: "delete",
      resource: "School",
      resourceId: params.id,
      detail: `School "${school.name}" deleted`,
    });
  }

  return NextResponse.json({ success: true });
