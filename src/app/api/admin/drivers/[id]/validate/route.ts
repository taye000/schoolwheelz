export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";
import { log } from "@/utils/audit";
import { createNotification } from "@/utils/notify";

/**
 * PATCH /api/admin/drivers/[id]/validate
 * Body: { status: "approved" | "rejected" | "suspended" | "pending", notes?: string }
 * Defaults to "approved" for backward compat.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden." },
      { status: 403 },
    );
  }

  await dbConnect();

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid driver ID." },
      { status: 400 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const status: string =
      body.status ?? (body.validate === false ? "rejected" : "approved");
    const notes: string | undefined = body.notes;

    const validStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status." },
        { status: 400 },
      );
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 },
      );
    }

    driver.verificationStatus = status as any;
    if (notes !== undefined) driver.verificationNotes = notes;
    // isValidated + isProfileActive are synced by pre-save hook
    if (status === "approved") {
      const hasActiveCar = driver.cars.some((c: any) => c.isActive);
      driver.isProfileActive = hasActiveCar;
    }

    // Clear malformed lastLocation (type set but no coordinates) — would break 2dsphere index
    if (
      driver.lastLocation &&
      (!driver.lastLocation.coordinates ||
        driver.lastLocation.coordinates.length === 0)
    ) {
      driver.lastLocation = undefined as any;
    }

    await driver.save();

    log({
      actorId: user.id,
      actorType: "admin",
      actorName: user.fullName,
      action: "status_change",
      resource: "Driver",
      resourceId: id,
      detail: `Driver verification status set to ${status}`,
      meta: { status, notes },
    });

    createNotification({
      userId: id,
      userType: "driver",
      type: "driver_validated",
      title:
        status === "approved"
          ? "Account Approved!"
          : `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body:
        status === "approved"
          ? "Congratulations! Your driver account has been approved. You can now accept bookings."
          : `Your driver account status has been updated to ${status}${notes ? ": " + notes : "."} `,
      href: "/profile",
      resourceId: id,
      resourceType: "driver",
    });

    const { password: _, ...safeDriver } = driver.toObject();
    return NextResponse.json({ success: true, data: safeDriver });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to update driver." },
      { status: 500 },
    );
  }
}
