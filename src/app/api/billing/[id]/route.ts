export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Bill from "@/models/Bill";
import { getAuthUser } from "@/utils/authApp";
import { log } from "@/utils/audit";

/**
 * GET /api/billing/[id]  — Admin or the bill's owner parent
 * PATCH /api/billing/[id] — Admin: edit total, adminNote, status
 * DELETE /api/billing/[id] — Admin: delete a bill
 */

export async function GET(
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
    const bill = await Bill.findById(params.id).lean();
    if (!bill)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );

    if (user.userType !== "admin" && bill.parent.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.json({ success: true, data: bill });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const { total, adminNote, status, paidAt } = await req.json();
    const update: Record<string, unknown> = { lastEditedBy: user.id };
    if (typeof total === "number") update.total = total;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status) update.status = status;
    if (status === "paid")
      update.paidAt = paidAt ? new Date(paidAt) : new Date();

    const bill = await Bill.findByIdAndUpdate(params.id, update, { new: true });
    if (!bill)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );

    log({
      actorId: user.id,
      actorType: "admin",
      actorName: user.fullName,
      action: status ? "status_change" : "update",
      resource: "Bill",
      resourceId: bill._id.toString(),
      detail: status
        ? `Bill ${bill.billRef} marked ${status}`
        : `Bill ${bill.billRef} updated (total: ${total ?? bill.total})`,
      meta: { total, status, adminNote },
    });

    return NextResponse.json({ success: true, data: bill });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const bill = await Bill.findByIdAndDelete(params.id);
    if (!bill)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );

    log({
      actorId: user.id,
      actorType: "admin",
      actorName: user.fullName,
      action: "delete",
      resource: "Bill",
      resourceId: params.id,
      detail: `Deleted bill ${bill.billRef}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
