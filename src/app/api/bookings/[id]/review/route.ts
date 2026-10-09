export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/utils/authApp";
import { createNotification } from "@/utils/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json({ success: false, message: "Admin only." }, { status: 403 });
  }

  try {
    const { decision, totalAmount, dueDate, note } = await req.json();
    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    }
    if (booking.status !== "pending" || booking.adminReviewStatus !== "awaiting_admin") {
      return NextResponse.json({ success: false, message: "This request has already been reviewed." }, { status: 409 });
    }

    if (decision === "reject") {
      const reason = typeof note === "string" ? note.trim() : "";
      if (!reason) {
        return NextResponse.json({ success: false, message: "Add a reason before rejecting this request." }, { status: 400 });
      }
      booking.adminReviewStatus = "rejected";
      booking.adminReviewNote = reason;
      booking.status = "canceled";
      booking.canceledAt = new Date();
      booking.canceledBy = user.id as any;
      booking.canceledByType = "admin";
      booking.cancelReason = reason;
      await booking.save();
      createNotification({
        userId: booking.parent.toString(),
        userType: "parent",
        type: "booking_cancelled",
        title: "Booking Request Not Approved",
        body: `Your request was not approved: ${reason}`,
        href: `/bookings/${booking._id}`,
        resourceId: booking._id.toString(),
        resourceType: "booking",
      });
      return NextResponse.json({ success: true, data: booking });
    }

    const parsedDueDate = new Date(dueDate);
    if (
      decision !== "approve" ||
      typeof totalAmount !== "number" || !Number.isFinite(totalAmount) || totalAmount < 0 ||
      Number.isNaN(parsedDueDate.getTime())
    ) {
      return NextResponse.json(
        { success: false, message: "Approval requires a valid total and due date." },
        { status: 400 },
      );
    }

    booking.adminReviewStatus = "approved";
    booking.adminReviewNote = typeof note === "string" ? note.trim() : "";
    booking.totalAmount = totalAmount;
    booking.amountIncurred = 0;
    booking.dueDate = parsedDueDate;
    await booking.save();
    createNotification({
      userId: booking.driver.toString(),
      userType: "driver",
      type: "booking_new",
      title: "Approved Booking Request",
      body: `An admin approved booking ${booking.bookingId}. Review and accept or decline it.`,
      href: "/trips",
      resourceId: booking._id.toString(),
      resourceType: "booking",
    });
    return NextResponse.json({ success: true, data: booking });
  } catch {
    return NextResponse.json({ success: false, message: "Could not review this request." }, { status: 500 });
  }
}