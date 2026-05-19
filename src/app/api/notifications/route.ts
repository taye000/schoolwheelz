export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/utils/authApp";

/**
 * GET /api/notifications
 * Returns the 30 most recent notifications for the authenticated user.
 * Response includes { data, unreadCount }
 *
 * PATCH /api/notifications  { action: "mark_all_read" }
 * Marks all unread notifications as read.
 */

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ userId: user.id, read: false }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const { action } = await req.json();
    if (action === "mark_all_read") {
      await Notification.updateMany(
        { userId: user.id, read: false },
        { $set: { read: true } },
      );
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, message: "Unknown action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
