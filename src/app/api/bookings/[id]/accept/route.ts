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
    if (user.userType !== "driver") {
      return NextResponse.json(
        { success: false, message: "Only drivers can accept bookings" },
        { status: 403 }
      );
    }

    const booking = await Booking.findById(params.id).populate("driver");
    if (!booking)
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

    if (booking.driver._id.toString() !== user.id)
      return NextResponse.json({ success: false, message: "Not your booking" }, { status: 403 });

    if (booking.status !== "pending")
      return NextResponse.json({ success: false, message: "Booking already processed" }, { status: 400 });

    const driver = await Driver.findById(user.id);
    if (!driver)
      return NextResponse.json({ success: false, message: "Driver not found" }, { status: 404 });

    if (driver.availableSeats < booking.seatsBooked)
      return NextResponse.json({ success: false, message: "Not enough seats" }, { status: 400 });

    driver.availableSeats -= booking.seatsBooked;
    await driver.save();

    booking.status = "accepted";
    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
