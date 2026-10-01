export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS, SmsTemplates } from "@/utils/sms";
import { createNotification } from "@/utils/notify";

/**
 * POST /api/bookings/[id]/start
 * Driver taps "Start Trip" — changes status to in_progress,
 * enables tracking, and sends "Driver on the way" SMS to parent.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver") {
    return NextResponse.json(
      { success: false, message: "Only drivers can start trips" },
      { status: 403 },
    );
  }

  try {
    const booking = await Booking.findById(params.id);
    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 },
      );

    if (booking.driver.toString() !== user.id)
      return NextResponse.json(
        { success: false, message: "Not your booking" },
        { status: 403 },
      );

    if (booking.status !== "accepted")
      return NextResponse.json(
        {
          success: false,
          message: `Cannot start a booking with status "${booking.status}"`,
        },
        { status: 400 },
      );

    // Read body once
    const body = (await req.json().catch(() => ({}))) as {
      boardedChildIds?: string[];
      startLat?: number;
      startLng?: number;
    };
    const boardedChildIds: string[] = body.boardedChildIds ?? [];
    const hasStartGPS =
      typeof body.startLat === "number" && Number.isFinite(body.startLat) &&
      typeof body.startLng === "number" && Number.isFinite(body.startLng) &&
      body.startLat >= -90 && body.startLat <= 90 &&
      body.startLng >= -180 && body.startLng <= 180;
    if (!hasStartGPS) {
      return NextResponse.json(
        { success: false, message: "Allow location access before starting the trip." },
        { status: 400 },
      );
    }

    const now = new Date();
    booking.children.forEach((child: any) => {
      if (boardedChildIds.includes(child._id.toString())) {
        child.pickedUp = true;
        child.pickupTime = now;
      }
    });

    booking.status = "in_progress";
    (booking as any).tripStartedAt = now;
    booking.tracking.isTrackingEnabled = true;
    booking.tracking.lastUpdated = now;
    booking.tracking.currentLocation = {
      type: "Point",
      coordinates: [body.startLng!, body.startLat!],
    };
    booking.tracking.startLocation = {
      type: "Point",
      coordinates: [body.startLng!, body.startLat!],
    };
    booking.markModified("tracking");
    await booking.save();

    // Update driver liveStatus
    await Driver.findByIdAndUpdate(user.id, { liveStatus: "on_trip" });

    // SMS parent: "Driver on the way"
    const parent = await Parent.findById(booking.parent);
    if (parent?.phoneNumber) {
      await sendSMS(
        parent.phoneNumber,
        SmsTemplates.driverOnTheWay(user.fullName, 10), // default 10-min ETA
        {
          eventType: "trip_started",
          bookingId: booking._id.toString(),
          triggeredBy: user.id,
        },
      );
    }

    createNotification({
      userId: booking.parent.toString(),
      userType: "parent",
      type: "trip_started",
      title: "Trip Started",
      body: `${user.fullName} has started the trip and is on the way!`,
      href: `/bookings/${booking._id}`,
      resourceId: booking._id.toString(),
      resourceType: "booking",
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
