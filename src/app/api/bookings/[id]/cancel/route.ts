export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";
import { log } from "@/utils/audit";
import { createNotification } from "@/utils/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "parent" && user.userType !== "driver") {
    return NextResponse.json({ success: false, message: "Only parents and drivers can cancel bookings." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ success: false, message: "A reason is required to cancel a booking." }, { status: 400 });
    }
    const booking = await Booking.findById(params.id).populate("driver");
    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 },
      );

    if (user.userType === "parent" && booking.parent.toString() !== user.id)
      return NextResponse.json(
        { success: false, message: "Not your booking" },
        { status: 403 },
      );

    if (user.userType === "driver" && booking.driver._id.toString() !== user.id)
      return NextResponse.json(
        { success: false, message: "Not your booking" },
        { status: 403 },
      );

    if (booking.status === "canceled")
      return NextResponse.json(
        { success: false, message: "Already cancelled" },
        { status: 400 },
      );

    if (booking.status === "accepted") {
      const driver = await Driver.findById(booking.driver._id);
      if (driver) {
        driver.availableSeats += booking.seatsBooked;
        await driver.save();
      }
    }

    booking.status = "canceled";
    booking.canceledAt = new Date();
    booking.canceledBy = user.id as any;
    booking.canceledByType = user.userType;
    booking.cancelReason = reason;
    await booking.save();
    if (user.userType === "driver") {
      await Driver.findByIdAndUpdate(user.id, { $inc: { cancellations: 1 } });
    }

    log({
      actorId: user.id,
      actorType: user.userType as "driver" | "parent" | "admin",
      actorName: user.fullName,
      action: "status_change",
      resource: "Booking",
      resourceId: booking._id.toString(),
      detail: `Booking ${booking.bookingId} cancelled by ${user.userType}: ${reason}`,
    });

    // Notify the other party
    if (user.userType === "parent") {
      createNotification({
        userId: booking.driver._id.toString(),
        userType: "driver",
        type: "booking_cancelled",
        title: "Booking Cancelled",
        body: `${user.fullName} cancelled their booking: ${reason}`,
        href: `/trips`,
        resourceId: booking._id.toString(),
        resourceType: "booking",
      });
    } else if (user.userType === "driver") {
      createNotification({
        userId: booking.parent.toString(),
        userType: "parent",
        type: "booking_cancelled",
        title: "Booking Cancelled",
        body: `Your driver cancelled booking ${booking.bookingId}: ${reason}`,
        href: `/bookings/${booking._id}`,
        resourceId: booking._id.toString(),
        resourceType: "booking",
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
