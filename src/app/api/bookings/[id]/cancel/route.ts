export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const booking = await Booking.findById(params.id).populate("driver");
    if (!booking)
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

    if (
      user.userType === "parent" &&
      booking.parent.toString() !== user.id
    )
      return NextResponse.json({ success: false, message: "Not your booking" }, { status: 403 });

    if (
      user.userType === "driver" &&
      booking.driver._id.toString() !== user.id
    )
      return NextResponse.json({ success: false, message: "Not your booking" }, { status: 403 });

    if (booking.status === "canceled")
      return NextResponse.json({ success: false, message: "Already cancelled" }, { status: 400 });

    if (booking.status === "accepted") {
      const driver = await Driver.findById(booking.driver._id);
      if (driver) {
        driver.availableSeats += booking.seatsBooked;
        await driver.save();
      }
    }

    booking.status = "canceled";
    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
