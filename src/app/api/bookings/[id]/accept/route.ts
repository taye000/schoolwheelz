export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { sendSMS, SmsTemplates } from "@/utils/sms";
import { log } from "@/utils/audit";
import { createNotification } from "@/utils/notify";
import { bookingsShareTripSlot } from "@/utils/bookingSlots";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    if (user.userType !== "driver") {
      return NextResponse.json(
        { success: false, message: "Only drivers can accept bookings" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const price =
      typeof body.price === "number" && body.price >= 0
        ? body.price
        : undefined;

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
        { success: false, message: "Booking already processed" },
        { status: 400 },
      );
    if (booking.adminReviewStatus && booking.adminReviewStatus !== "approved") {
      return NextResponse.json(
        { success: false, message: "This booking is still awaiting admin review." },
        { status: 409 },
      );
    }

    const driver = await Driver.findById(user.id);
    if (!driver)
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 },
      );

    const activeCar = driver.cars.find((car: any) => car.isActive);
    if (!activeCar) {
      return NextResponse.json(
        { success: false, message: "Set an active vehicle before accepting bookings." },
        { status: 409 },
      );
    }
    const reservations = await Booking.find({
      driver: user.id,
      status: { $in: ["accepted", "in_progress"] },
      isDeleted: false,
    }).select("bookingType tripDate recurringMeta direction returnTime seatsBooked");
    const committedSeats = reservations
      .filter((reservation: any) =>
        reservation._id.toString() !== booking._id.toString() &&
        bookingsShareTripSlot(booking, reservation),
      )
      .reduce((total: number, reservation: any) => total + (reservation.seatsBooked ?? 0), 0);
    const remainingSeats = activeCar.availableSeats - committedSeats;
    if (booking.seatsBooked > remainingSeats) {
      return NextResponse.json(
        {
          success: false,
          message: `Only ${Math.max(0, remainingSeats)} seat${remainingSeats === 1 ? "" : "s"} remain for this slot.`,
        },
        { status: 409 },
      );
    }

    booking.status = "accepted";
    if (price !== undefined) booking.price = price;
    await booking.save();

    // SMS parent
    const parent = await Parent.findById(booking.parent);
    if (parent?.phoneNumber) {
      await sendSMS(
        parent.phoneNumber,
        SmsTemplates.bookingAccepted(parent.fullName, driver.fullName),
        {
          eventType: "booking_accepted",
          bookingId: booking._id.toString(),
          triggeredBy: user.id,
        },
      );
    }

    log({
      actorId: user.id,
      actorType: "driver",
      actorName: user.fullName,
      action: "status_change",
      resource: "Booking",
      resourceId: booking._id.toString(),
      detail: `Driver accepted booking${price !== undefined ? ` at KES ${price}` : ""}`,
      meta: { status: "accepted", price },
    });

    createNotification({
      userId: booking.parent.toString(),
      userType: "parent",
      type: "booking_accepted",
      title: "Booking Accepted",
      body: `${driver.fullName} has accepted your booking${price !== undefined ? ` — KES ${price}` : ""}.`,
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
