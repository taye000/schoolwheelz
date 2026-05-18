export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";

/**
 * PATCH /api/admin/drivers/[id]/validate
 * Validates a driver (admin only). Sets isValidated = true.
 * If the driver already has an active car, also sets isProfileActive = true.
 *
 * Body: { validate: boolean } — pass false to revoke validation.
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
    const { validate = true } = await req.json().catch(() => ({}));

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 },
      );
    }

    driver.isValidated = Boolean(validate);
    const hasActiveCar = driver.cars.some((c: any) => c.isActive);
    driver.isProfileActive = driver.isValidated && hasActiveCar;

    await driver.save();

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
