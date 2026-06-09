export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS } from "@/utils/sms";
import { createNotification } from "@/utils/notify";

/**
 * POST /api/bookings/[id]/arrive
 * Driver taps "I've Arrived" — records arrivedAt timestamp and
 * notifies the parent via SMS.
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
      { success: false, message: "Only drivers can use this" },
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

    if (booking.status !== "accepted")
      return NextResponse.json(
        { success: false, message: "Booking must be accepted before arriving" },
        { status: 400 },
      );

    if (booking.arrivedAt)
      return NextResponse.json(
        { success: false, message: "Already marked as arrived" },
        { status: 400 },
      );

    booking.arrivedAt = new Date();
    await booking.save();

    const parent = await Parent.findById(
      booking.parent,
      "fullName phoneNumber",
    );
    if (parent?.phoneNumber) {
      await sendSMS(
        parent.phoneNumber,
        `Hi ${parent.fullName}, your School Wheelz driver ${user.fullName} has arrived at the pickup point. Please send your child(ren) out now!`,
        {
          eventType: "driver_arrived",
          bookingId: booking._id.toString(),
          triggeredBy: user.id,
        },
      );
    }

    createNotification({
      userId: booking.parent.toString(),
      userType: "parent",
      type: "driver_arrived",
      title: "Driver Has Arrived",
      body: `${user.fullName} has arrived at the pickup point — please send your child(ren) out now!`,
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
