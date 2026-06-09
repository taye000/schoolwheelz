export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import SmsLog from "@/models/SmsLog";
import { getAuthUser } from "@/utils/authApp";

/**
 * GET /api/admin/sms-logs
 * Admin only. Returns paginated SMS send history with filtering.
 *
 * Query params:
 *   status=sent|failed
 *   bookingId=<booking _id string>
 *   recipient=<partial phone match>
 *   eventType=<e.g. booking_accepted>
 *   from=YYYY-MM-DD
 *   to=YYYY-MM-DD
 *   page=1
 *   limit=50 (max 100)
 */
export async function GET(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const bookingId = searchParams.get("bookingId");
  const recipient = searchParams.get("recipient");
  const eventType = searchParams.get("eventType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

  try {
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (bookingId) filter.bookingId = bookingId;
    if (eventType) filter.eventType = eventType;
    if (recipient)
      filter.to = { $elemMatch: { $regex: recipient, $options: "i" } };
    if (from || to) {
      filter.createdAt = {} as Record<string, unknown>;
      if (from)
        (filter.createdAt as Record<string, unknown>).$gte = new Date(from);
      if (to)
        (filter.createdAt as Record<string, unknown>).$lte = new Date(
          new Date(to).setHours(23, 59, 59, 999),
        );
    }

    const [logs, total] = await Promise.all([
      SmsLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SmsLog.countDocuments(filter),
    ]);

    // Summary counts for dashboard display
    const [sentCount, failedCount] = await Promise.all([
      SmsLog.countDocuments({ ...filter, status: "sent" }),
      SmsLog.countDocuments({ ...filter, status: "failed" }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      summary: { sent: sentCount, failed: failedCount, total },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/admin/sms-logs]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
