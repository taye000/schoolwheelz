export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS, SmsTemplates } from "@/utils/sms";

/**
 * PATCH /api/bookings/[id]/pickup/[childId]
 * Driver marks a single child as picked up.
 * Sends "Kevin has been picked up" SMS to parent.
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
      { success: false, message: "Only drivers can mark pickups" },
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
        { success: false, message: "Trip must be in progress to mark pickups" },
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

    if (child.pickedUp)
      return NextResponse.json(
        { success: false, message: "Child already marked as picked up" },
        { status: 400 },
      );

    child.pickedUp = true;
    child.pickupTime = new Date();
    await booking.save();

    // SMS parent: "Kevin has been picked up"
    const parent = await Parent.findById(booking.parent);
    if (parent?.phoneNumber) {
      await sendSMS(
        parent.phoneNumber,
        SmsTemplates.childPickedUp(child.name, user.fullName),
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
