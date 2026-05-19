export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import School from "@/models/School";
import { getAuthUser } from "@/utils/authApp";
import { log } from "@/utils/audit";
import { createNotification } from "@/utils/notify";

/**
 * PATCH /api/schools/[id]/approve
 * Admin only: approve (and optionally edit name/estate/coordinates) a pending school
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

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {
    status: "approved",
    adminNote: body.adminNote ?? "",
  };
  if (body.name) updates.name = body.name.trim();
  if (body.estate) updates.estate = body.estate.trim();
  if (body.coordinates) {
    updates["location.coordinates"] = body.coordinates;
  }

  const school = await School.findByIdAndUpdate(params.id, updates, {
    new: true,
  });
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
    detail: `School "${school.name}" approved`,
  });

  if (school.requestedBy) {
    createNotification({
      userId: school.requestedBy.toString(),
      userType: "driver",
      type: "school_approved",
      title: "School Request Approved",
      body: `Your school request for "${school.name}" has been approved and is now visible to parents.`,
      href: "/profile",
      resourceId: params.id,
      resourceType: "school",
    });
  }

  return NextResponse.json({ success: true, data: school });
}
