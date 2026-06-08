export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS } from "@/utils/sms";
import { createNotification } from "@/utils/notify";

/**
 * POST /api/bookings/[id]/complete
 * Driver taps "End Trip" — marks all children as dropped off,
 * sets status to completed, stops tracking, updates driver counters.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver")
    return NextResponse.json(
      { success: false, message: "Only drivers can end trips" },
      { status: 403 },
    );

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

    if (booking.status !== "in_progress")
      return NextResponse.json(
        { success: false, message: "Trip is not in progress" },
        { status: 400 },
      );

    const now = new Date();
    booking.children.forEach((child: any) => {
      if (!child.droppedOff) {
        child.droppedOff = true;
        child.dropoffTime = now;
      }
    });

    booking.status = "completed";
    // Save status + children changes (don't touch tracking here)
    await booking.save();

    // Parse optional final GPS position sent by the client
    const body = (await req.json().catch(() => ({}))) as {
      lat?: number;
      lng?: number;
    };
    const hasLocation =
      typeof body.lat === "number" && typeof body.lng === "number";

    // Use $set dot-notation so we never touch tracking.currentLocation when absent
    await Booking.findByIdAndUpdate(params.id, {
      $set: {
        "tracking.isTrackingEnabled": false,
        "tracking.lastUpdated": now,
        ...(hasLocation && {
          "tracking.currentLocation": {
            type: "Point",
            coordinates: [body.lng, body.lat],
          },
          "tracking.finalLocation": {
            type: "Point",
            coordinates: [body.lng, body.lat],
          },
        }),
      },
    });

    await Driver.findByIdAndUpdate(user.id, {
      $inc: { completedTrips: 1, totalTrips: 1 },
      liveStatus: "online",
    });

    const parent = await Parent.findById(
      booking.parent,
      "fullName phoneNumber",
    );
    if (parent?.phoneNumber) {
      const childNames = booking.children.map((c: any) => c.name).join(", ");
      await sendSMS(
        parent.phoneNumber,
        `Hi ${parent.fullName}, your School Wheelz trip has been completed. ${childNames} ${booking.children.length === 1 ? "has" : "have"} been safely dropped off. Have a great day!`,
      );
    }

    createNotification({
      userId: booking.parent.toString(),
      userType: "parent",
      type: "trip_completed",
      title: "Trip Completed",
      body: `Your children have been safely dropped off. Trip complete!`,
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
