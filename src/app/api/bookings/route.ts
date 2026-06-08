export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser, AuthenticatedUser } from "@/utils/authApp";
import { generateBookingId } from "@/utils/generateBookingID";
import { createNotification } from "@/utils/notify";

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    if (user.userType !== "parent") {
      return NextResponse.json(
        { success: false, message: "Only parents can book" },
        { status: 403 },
      );
    }

    const {
      driverId,
      children,
      seatsBooked,
      tripDate,
      bookingType = "one_time",
      direction = "morning",
      returnTime,
      recurringDays,
      startDate,
      endDate,
      morningTime,
      eveningTime,
    } = await req.json();

    const driver = await Driver.findById(driverId);
    if (!driver)
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 },
      );

    const parent = await Parent.findById(user.id);
    if (!parent)
      return NextResponse.json(
        { success: false, message: "Parent not found" },
        { status: 404 },
      );

    const validChildIds = parent.children.map((c: any) => c._id?.toString());
    const isValid = children.every((c: any) =>
      validChildIds.includes(c._id?.toString()),
    );
    if (!isValid)
      return NextResponse.json(
        { success: false, message: "Invalid child selection" },
        { status: 400 },
      );

    if (bookingType === "recurring") {
      // Validate recurring fields
      if (!recurringDays?.length || !startDate || !morningTime) {
        return NextResponse.json(
          {
            success: false,
            message:
              "recurringDays, startDate, and morningTime are required for recurring bookings.",
          },
          { status: 400 },
        );
      }

      // Build the first tripDate from startDate + morningTime
      const firstDate = new Date(`${startDate}T${morningTime}:00`);

      const booking = await Booking.create({
        driver: driver._id,
        parent: user.id,
        children,
        seatsBooked,
        bookingType: "recurring",
        direction,
        tripDate: firstDate,
        status: "pending",
        bookingId: generateBookingId(),
        // Store recurring meta in a flexible field — we piggyback on the
        // existing schema by encoding it into a note. A proper Schedule
        // doc could be created here instead if the Schedule model is used.
        recurringMeta: {
          days: recurringDays,
          startDate,
          endDate: endDate || null,
          morningTime,
          eveningTime: eveningTime || null,
        },
      });

      await booking.populate([{ path: "driver" }, { path: "parent" }]);
      createNotification({
        userId: driver._id.toString(),
        userType: "driver",
        type: "booking_new",
        title: "New Booking Request",
        body: `${user.fullName} has sent a recurring booking request.`,
        href: `/trips`,
        resourceId: booking._id.toString(),
        resourceType: "booking",
      });
      return NextResponse.json(
        { success: true, data: booking },
        { status: 201 },
      );
    }

    // one_time booking
    if (!tripDate)
      return NextResponse.json(
        { success: false, message: "tripDate is required." },
        { status: 400 },
      );

    const booking = await Booking.create({
      driver: driver._id,
      parent: user.id,
      children,
      seatsBooked,
      bookingType: "one_time",
      direction,
      tripDate: new Date(tripDate),
      returnTime: returnTime || null,
      status: "pending",
      bookingId: generateBookingId(),
    });

    await booking.populate([{ path: "driver" }, { path: "parent" }]);
    createNotification({
      userId: driver._id.toString(),
      userType: "driver",
      type: "booking_new",
      title: "New Booking Request",
      body: `${user.fullName} has sent a booking request.`,
      href: `/trips`,
      resourceId: booking._id.toString(),
      resourceType: "booking",
    });
    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    const baseFilter: any = { isDeleted: false };

    if (id) {
      const booking = await Booking.findOne({ _id: id, ...baseFilter })
        .populate("driver")
        .populate("parent");
      if (!booking)
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 },
        );
      return NextResponse.json({ success: true, data: booking });
    }

    if (all && user.userType === "admin") {
      const bookings = await Booking.find(baseFilter)
        .populate("driver")
        .populate("parent");
      return NextResponse.json({ success: true, data: bookings });
    }

    if (user.userType === "parent") {
      baseFilter.parent = new mongoose.Types.ObjectId(user.id);
      // Optional: parent can filter to bookings with a specific driver (e.g. trip history on driver profile)
      const driverIdParam = searchParams.get("driverId");
      if (driverIdParam && mongoose.Types.ObjectId.isValid(driverIdParam)) {
        baseFilter.driver = new mongoose.Types.ObjectId(driverIdParam);
      }
    } else if (user.userType === "driver") {
      baseFilter.driver = new mongoose.Types.ObjectId(user.id);
    } else {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Optional filters
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (status) baseFilter.status = status;
    if (from || to) {
      baseFilter.tripDate = {} as any;
      if (from) (baseFilter.tripDate as any).$gte = new Date(from);
      if (to)
        (baseFilter.tripDate as any).$lte = new Date(
          new Date(to).setHours(23, 59, 59, 999),
        );
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10")),
    );
    const total = await Booking.countDocuments(baseFilter);
    const pages = Math.ceil(total / limit);

    const bookings = await Booking.find(baseFilter)
      .populate("driver", "fullName phoneNumber")
      .populate("parent", "fullName phoneNumber")
      .sort({ tripDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: { total, pages, page, limit },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const { bookingId, status } = await req.json();
    if (!bookingId || !status)
      return NextResponse.json(
        { success: false, message: "bookingId and status required" },
        { status: 400 },
      );

    if (!["admin", "driver"].includes(user.userType))
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 },
      );

    booking.status = status;
    await booking.save();
    await booking.populate([{ path: "driver" }, { path: "parent" }]);
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId)
      return NextResponse.json(
        { success: false, message: "bookingId required" },
        { status: 400 },
      );

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 },
      );

    if (user.userType !== "parent" || booking.parent.toString() !== user.id)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );

    booking.isDeleted = true;
    await booking.save();
    return NextResponse.json({ success: true, message: "Booking cancelled" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
