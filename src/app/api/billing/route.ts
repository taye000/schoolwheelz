export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Bill from "@/models/Bill";
import Booking from "@/models/Booking";
import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";
import { getAuthUser } from "@/utils/authApp";
import { log } from "@/utils/audit";

/**
 * GET /api/billing
 * Admin: list all bills with optional ?status=&parentId=&from=&to=
 * Parent: list their own bills
 */
export async function GET(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(req.url);

  try {
    if (user.userType === "admin") {
      const filter: Record<string, unknown> = {};
      const status = searchParams.get("status");
      const parentId = searchParams.get("parentId");
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (status) filter.status = status;
      if (parentId && mongoose.Types.ObjectId.isValid(parentId))
        filter.parent = parentId;
      if (from || to) {
        filter.periodStart = {};
        if (from)
          (filter.periodStart as Record<string, unknown>).$gte = new Date(from);
        if (to)
          (filter.periodStart as Record<string, unknown>).$lte = new Date(to);
      }
      const bills = await Bill.find(filter).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, data: bills });
    }

    if (user.userType === "parent") {
      const bills = await Bill.find({ parent: user.id })
        .sort({ periodStart: -1 })
        .lean();
      return NextResponse.json({ success: true, data: bills });
    }

    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  } catch (err) {
    console.error("[GET /api/billing]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/billing
 * Admin only — generate a bill for a parent over a custom date range.
 * Body: { parentId, periodStart, periodEnd, period: "weekly"|"monthly" }
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin only" },
      { status: 403 },
    );
  }

  try {
    const { parentId, periodStart, periodEnd, period } = await req.json();
    if (!parentId || !periodStart || !periodEnd || !period) {
      return NextResponse.json(
        {
          success: false,
          message: "parentId, periodStart, periodEnd, period required",
        },
        { status: 400 },
      );
    }

    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json(
        { success: false, message: "Parent not found" },
        { status: 404 },
      );
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Fetch completed bookings for this parent in the date range that have a price
    const bookings = await Booking.find({
      parent: parentId,
      status: "completed",
      isDeleted: false,
      tripDate: { $gte: start, $lte: end },
      price: { $gt: 0 },
    }).lean();

    const lineItems = await Promise.all(
      bookings.map(async (b: any) => {
        const driver = (await Driver.findById(b.driver)
          .select("fullName")
          .lean()) as any;
        return b.children.map((c: any) => ({
          bookingId: b._id,
          bookingRef: b.bookingId,
          tripDate: b.tripDate,
          childName: c.name,
          direction: b.direction,
          driverName: driver?.fullName ?? "Unknown",
          amount: b.price ?? 0,
        }));
      }),
    );
    const flat = lineItems.flat();
    const subtotal = flat.reduce((s, i) => s + i.amount, 0);

    // Unique bill ref
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await Bill.countDocuments();
    const billRef = `BILL-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const bill = await Bill.create({
      billRef,
      parent: parentId,
      parentName: parent.fullName,
      periodStart: start,
      periodEnd: end,
      period,
      lineItems: flat,
      subtotal,
      total: subtotal,
      status: "pending",
      lastEditedBy: user.id,
    });

    log({
      actorId: user.id,
      actorType: "admin",
      actorName: user.fullName,
      action: "create",
      resource: "Bill",
      resourceId: bill._id.toString(),
      detail: `Generated ${period} bill ${billRef} for ${parent.fullName} — KES ${subtotal}`,
    });

    return NextResponse.json({ success: true, data: bill }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/billing]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
