export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";

/**
 * PATCH /api/drivers/[id]/cars/[carId]
 * - activate: { action: "activate" }  — sets this car active, deactivates others
 * - edit:     { make?, model?, regNumber?, photo?, availableSeats?, color?, year? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; carId: string } },
) {
  await dbConnect();

  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  const { id, carId } = params;

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(carId)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid ID." },
      { status: 400 },
    );
  }

  if (user.id !== id && user.userType !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden." },
      { status: 403 },
    );
  }

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 },
      );
    }

    const car = driver.cars.find((c: any) => c._id.toString() === carId);
    if (!car) {
      return NextResponse.json(
        { success: false, error: "Car not found." },
        { status: 404 },
      );
    }

    const body = await req.json();

    if (body.action === "activate") {
      // Deactivate all, then activate the target
      driver.cars.forEach((c: any) => {
        c.isActive = false;
      });
      car.isActive = true;
      driver.isProfileActive = driver.isValidated;
    } else {
      // Edit car fields — only allow safe fields
      const allowed = [
        "make",
        "model",
        "regNumber",
        "photo",
        "availableSeats",
        "color",
        "year",
        "vehicleType",
      ];
      for (const field of allowed) {
        if (body[field] !== undefined) {
          car[field] = body[field];
        }
      }
    }

    await driver.save();

    const { password: _, ...safeDriver } = driver.toObject();
    return NextResponse.json({ success: true, data: safeDriver });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to update car." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; carId: string } },
) {
  await dbConnect();

  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  const { id, carId } = params;

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(carId)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid ID." },
      { status: 400 },
    );
  }

  if (user.id !== id && user.userType !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden." },
      { status: 403 },
    );
  }

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found." },
        { status: 404 },
      );
    }

    const carIndex = driver.cars.findIndex(
      (c: any) => c._id.toString() === carId,
    );
    if (carIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Car not found." },
        { status: 404 },
      );
    }

    driver.cars.splice(carIndex, 1);

    // If no active car remains, deactivate driver profile
    const hasActiveCar = driver.cars.some((c: any) => c.isActive);
    if (!hasActiveCar) driver.isProfileActive = false;

    await driver.save();

    const { password: _, ...safeDriver } = driver.toObject();
    return NextResponse.json({ success: true, data: safeDriver });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to remove car." },
      { status: 500 },
    );
  }
}
