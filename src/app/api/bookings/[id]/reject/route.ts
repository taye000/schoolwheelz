export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS, SmsTemplates } from "@/utils/sms";

/**
 * PATCH /api/bookings/[id]/reject
 * Driver declines a pending booking request.
 * Status → "canceled". Parent receives an SMS with an optional reason.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver") {
    return NextResponse.json(
      { success: false, message: "Only drivers can reject bookings" },
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

    if (booking.status !== "pending")
      return NextResponse.json(
        {
          success: false,
          message: `Cannot reject a booking with status "${booking.status}"`,
        },
        { status: 400 },
      );

    const { reason } = await req.json().catch(() => ({ reason: undefined }));

    booking.status = "canceled";
    await booking.save();

    const [driver, parent] = await Promise.all([
      Driver.findById(user.id, "fullName"),
      Parent.findById(booking.parent, "fullName phoneNumber"),
    ]);

    if (parent?.phoneNumber) {
      await sendSMS(
        parent.phoneNumber,
        SmsTemplates.bookingRejected(driver?.fullName ?? "The driver", reason),
        {
          eventType: "booking_rejected",
          bookingId: booking._id.toString(),
          triggeredBy: user.id,
        },
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
