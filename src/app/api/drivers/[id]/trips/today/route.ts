export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/utils/authApp";

/**
 * GET /api/drivers/[id]/trips/today
 *
 * Returns all accepted or in-progress bookings assigned to this driver
 * for today's date, each with the full children list (including per-child
 * pickup/dropoff state and guardian notes) and the parent's phone number
 * for the driver's reference.
 *
 * Children within each booking are sorted by their position in pickupOrder.
 *
 * Auth: driver can only fetch their own. Admin can fetch any.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (user.userType !== "driver" && user.userType !== "admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  if (user.userType === "driver" && user.id !== params.id) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    // Build a date range covering the whole of today (UTC)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      driver: params.id,
      status: { $in: ["accepted", "in_progress"] },
      tripDate: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    })
      .populate("parent", "fullName phoneNumber address")
      .sort({ tripDate: 1 })
      .lean();

    // Sort each booking's children by their pickupOrder position
    const sorted = bookings.map((b: any) => {
      if (b.pickupOrder?.length) {
        const orderMap: Record<string, number> = {};
        b.pickupOrder.forEach((childId: any, i: number) => {
          orderMap[childId.toString()] = i;
        });
        b.children = [...b.children].sort((a: any, z: any) => {
          const ai = orderMap[a._id?.toString()] ?? 999;
          const zi = orderMap[z._id?.toString()] ?? 999;
          return ai - zi;
        });
      }
      return b;
    });

    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
