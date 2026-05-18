export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/utils/authApp";

/**
 * PATCH /api/bookings/[id]/track
 * Driver's device pushes GPS coordinates every ~15s during an active trip.
 * Body: { lat: number; lng: number }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver")
    return NextResponse.json({ success: false, message: "Only drivers can update location" }, { status: 403 });

  try {
    const { lat, lng } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number")
      return NextResponse.json({ success: false, message: "lat and lng required" }, { status: 400 });

    const booking = await Booking.findOneAndUpdate(
      { _id: params.id, driver: user.id, status: "in_progress" },
      {
        $set: {
          "tracking.currentLocation": { type: "Point", coordinates: [lng, lat] },
          "tracking.lastUpdated": new Date(),
          "tracking.isTrackingEnabled": true,
        },
      },
      { new: true, select: "_id tracking" },
    );

    if (!booking)
      return NextResponse.json({ success: false, message: "Active booking not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
