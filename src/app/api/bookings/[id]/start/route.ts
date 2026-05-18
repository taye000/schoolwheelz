export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS, SmsTemplates } from "@/utils/sms";

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

    // Mark boarded children as picked up
    const { boardedChildIds = [] }: { boardedChildIds?: string[] } = await req
      .json()
      .catch(() => ({ boardedChildIds: [] }));

    const now = new Date();
    booking.children.forEach((child: any) => {
      if (boardedChildIds.includes(child._id.toString())) {
        child.pickedUp = true;
        child.pickupTime = now;
      }
    });

    booking.status = "in_progress";
    booking.tracking.isTrackingEnabled = true;
    booking.tracking.lastUpdated = new Date();
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
      );
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
