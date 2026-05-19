export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/utils/authApp";

/**
 * PATCH /api/notifications/[id]  — mark a single notification as read
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json(
      { success: false, message: "Invalid ID" },
      { status: 400 },
    );
  }

  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: params.id, userId: user.id },
      { $set: { read: true } },
      { new: true },
    );
    if (!notif) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: notif });
  } catch (err) {
    console.error("[PATCH /api/notifications/[id]]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
