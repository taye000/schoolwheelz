export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";

/** POST /api/drivers/[id]/cars — add a new car */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();

  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid driver ID." },
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
    const { make, model, regNumber, photo, availableSeats } = await req.json();

    if (!make || !model || !regNumber || !availableSeats) {
      return NextResponse.json(
        {
          success: false,
          error: "make, model, regNumber and availableSeats are required.",
        },
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

    // First car is automatically set active
    const isFirstCar = driver.cars.length === 0;

    driver.cars.push({
      make,
      model,
      regNumber,
      photo,
      availableSeats,
      isActive: isFirstCar,
    } as any);

    // Update isProfileActive: validated + has active car
    if (isFirstCar && driver.isValidated) {
      driver.isProfileActive = true;
    }

    await driver.save();

    const { password: _, ...safeDriver } = driver.toObject();
    return NextResponse.json(
      { success: true, data: safeDriver },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to add car." },
      { status: 500 },
    );
  }
}
