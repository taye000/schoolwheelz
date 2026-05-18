export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/utils/authApp";

/**
 * PATCH /api/bookings/[id]/driver-notes
 * Driver adds post-trip notes/ratings per child.
 * Body: { notes: Array<{ childId: string; note?: string; rating?: number }> }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver")
    return NextResponse.json({ success: false, message: "Only drivers can add notes" }, { status: 403 });

  try {
    const { notes } = await req.json();
    if (!Array.isArray(notes))
      return NextResponse.json({ success: false, message: "notes array required" }, { status: 400 });

    const booking = await Booking.findById(params.id);
    if (!booking)
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

    if (booking.driver.toString() !== user.id)
      return NextResponse.json({ success: false, message: "Not your booking" }, { status: 403 });

    if (booking.status !== "completed")
      return NextResponse.json({ success: false, message: "Can only add notes after trip completes" }, { status: 400 });

    for (const { childId, note, rating } of notes) {
      const child = booking.children.find((c: any) => c._id.toString() === childId);
      if (child) {
        if (note !== undefined) child.driverNote = note;
        if (rating !== undefined && rating >= 1 && rating <= 5) child.driverRating = rating;
      }
    }

    await booking.save();
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
