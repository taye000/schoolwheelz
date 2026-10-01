export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import DriverDocument from "@/models/DriverDocument";
import { getAuthUser } from "@/utils/authApp";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "driver" || user.id !== params.id) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid driver ID." }, { status: 400 });
  }

  try {
    const { status, lat, lng } = await req.json();
    if (status !== "online" && status !== "offline") {
      return NextResponse.json({ success: false, message: "Choose online or offline." }, { status: 400 });
    }
    const driver = await Driver.findById(params.id);
    if (!driver) {
      return NextResponse.json({ success: false, message: "Driver not found." }, { status: 404 });
    }
    if (driver.liveStatus === "on_trip") {
      return NextResponse.json({ success: false, message: "Finish the active trip before going offline." }, { status: 409 });
    }

    const update: Record<string, unknown> = {
      liveStatus: status,
      lastActiveAt: new Date(),
    };
    if (status === "online") {
      const hasLocation =
        typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
        typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180;
      if (!hasLocation) {
        return NextResponse.json({ success: false, message: "Allow location access to go online." }, { status: 400 });
      }
      if (driver.verificationStatus !== "approved" || !driver.isProfileActive || !driver.cars.some((car: any) => car.isActive)) {
        return NextResponse.json({ success: false, message: "Your profile and active vehicle must be approved before going online." }, { status: 409 });
      }
      const uploadedTypes = await DriverDocument.distinct("type", { driver: params.id });
      const requiredTypes = ["idFront", "idBack", "license", "goodConduct"];
      if (requiredTypes.some((type) => !uploadedTypes.includes(type))) {
        return NextResponse.json({ success: false, message: "Upload your ID, driving licence, and certificate of good conduct before going online." }, { status: 409 });
      }
      update.lastLocation = { type: "Point", coordinates: [lng, lat] };
    }

    const updated = await Driver.findByIdAndUpdate(params.id, update, { new: true })
      .select("liveStatus lastActiveAt lastLocation isProfileActive");
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Could not update availability." }, { status: 500 });
  }
}