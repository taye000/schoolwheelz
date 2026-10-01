export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";

function addressKey(address: { placeId?: string; label: string }) {
  return address.placeId || address.label.trim().toLocaleLowerCase();
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "parent") {
    return NextResponse.json({ success: false, message: "Parents only." }, { status: 403 });
  }

  try {
    const parent = await Parent.findById(user.id).select("savedAddresses locationHistory");
    if (!parent) {
      return NextResponse.json({ success: false, message: "Parent not found." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        savedAddresses: parent.savedAddresses ?? [],
        locationHistory: parent.locationHistory ?? [],
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load locations." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "parent") {
    return NextResponse.json({ success: false, message: "Parents only." }, { status: 403 });
  }

  try {
    const { kind, address } = await req.json();
    const label = typeof address?.label === "string" ? address.label.trim() : "";
    const lat = Number(address?.lat);
    const lng = Number(address?.lng);
    if (
      !["saved", "history"].includes(kind) ||
      !label ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      return NextResponse.json({ success: false, message: "A valid address is required." }, { status: 400 });
    }

    const parent = await Parent.findById(user.id);
    if (!parent) {
      return NextResponse.json({ success: false, message: "Parent not found." }, { status: 404 });
    }

    const normalized = {
      label,
      placeId: typeof address.placeId === "string" ? address.placeId : undefined,
      lat,
      lng,
    };
    const target = kind === "saved" ? parent.savedAddresses : parent.locationHistory;
    const key = addressKey(normalized);
    const remaining = (target ?? []).filter((item: any) => addressKey(item) !== key);
    target.splice(0, target.length, normalized, ...remaining);
    if (kind === "history") target.splice(10);
    if (kind === "saved") target.splice(20);
    await parent.save();

    return NextResponse.json({
      success: true,
      data: {
        savedAddresses: parent.savedAddresses,
        locationHistory: parent.locationHistory,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to save location." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "parent") {
    return NextResponse.json({ success: false, message: "Parents only." }, { status: 403 });
  }

  try {
    const { placeId, label } = await req.json();
    const parent = await Parent.findById(user.id);
    if (!parent) {
      return NextResponse.json({ success: false, message: "Parent not found." }, { status: 404 });
    }
    const key = addressKey({ placeId, label: typeof label === "string" ? label : "" });
    parent.savedAddresses = parent.savedAddresses.filter((item: any) => addressKey(item) !== key);
    await parent.save();
    return NextResponse.json({ success: true, data: parent.savedAddresses });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to remove saved location." }, { status: 500 });
  }
}