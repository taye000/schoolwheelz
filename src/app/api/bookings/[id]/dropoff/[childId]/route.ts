export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS, SmsTemplates } from "@/utils/sms";

/**
 * PATCH /api/bookings/[id]/dropoff/[childId]
 * Driver marks a single child as dropped off at school.
 * Sends "Kevin arrived at school" SMS to parent.
 * If ALL children are dropped off → booking auto-completes and
 * driver counters (completedTrips, totalTrips) are incremented.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; childId: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver") {
    return NextResponse.json(
      { success: false, message: "Only drivers can mark drop-offs" },
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

    if (booking.status !== "in_progress")
      return NextResponse.json(
        {
          success: false,
          message: "Trip must be in progress to mark drop-offs",
        },
        { status: 400 },
      );

    const child = booking.children.find(
      (c: any) => c._id.toString() === params.childId,
    );
    if (!child)
      return NextResponse.json(
        { success: false, message: "Child not found in booking" },
        { status: 404 },
      );

    if (child.droppedOff)
      return NextResponse.json(
        { success: false, message: "Child already marked as dropped off" },
        { status: 400 },
      );

    child.droppedOff = true;
    child.dropoffTime = new Date();

    // Auto-complete when every child has been dropped off
    const allDroppedOff = booking.children.every((c: any) => c.droppedOff);
    if (allDroppedOff) {
      booking.status = "completed";
      booking.tracking = {
        ...(booking.tracking ?? {}),
        isTrackingEnabled: false,
        lastUpdated: new Date(),
      };
    }

    await booking.save();

    // SMS parent: "Kevin arrived at school"
    const parent = await Parent.findById(booking.parent);
    if (parent?.phoneNumber) {
      await sendSMS(
        parent.phoneNumber,
        SmsTemplates.arrivedAtSchool(child.name, child.school),
        {
          eventType: "child_dropped_off",
          bookingId: booking._id.toString(),
          triggeredBy: user.id,
        },
      );
    }

    // If trip just completed → update driver counters + set back online
    if (allDroppedOff) {
      await Driver.findByIdAndUpdate(user.id, {
        $inc: { completedTrips: 1, totalTrips: 1 },
        liveStatus: "online",
      });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
