export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { createHash } from "crypto";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser, AuthenticatedUser } from "@/utils/authApp";
import { generateBookingId } from "@/utils/generateBookingID";
import { createNotification } from "@/utils/notify";

function normalizeBookingLocation(value: any) {
  if (
    !value ||
    !Number.isFinite(value.lat) ||
    !Number.isFinite(value.lng) ||
    value.lat < -90 ||
    value.lat > 90 ||
    value.lng < -180 ||
    value.lng > 180
  ) return null;

  return {
    lat: value.lat,
    lng: value.lng,
    label: typeof value.label === "string" ? value.label.trim() : undefined,
  };
}

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
      pickupLocation,
      dropoffLocation,
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

    if (!Array.isArray(children) || children.length === 0) {
      return NextResponse.json(
        { success: false, message: "Select at least one child." },
        { status: 400 },
      );
    }

    const childIds = children.map((child: any) => child?._id?.toString());
    const uniqueChildIds = Array.from(new Set(childIds));
    const selectedChildren = parent.children.filter((child: any) =>
      uniqueChildIds.includes(child._id?.toString()),
    );
    if (
      childIds.some((id: string | undefined) => !id) ||
      uniqueChildIds.length !== childIds.length ||
      selectedChildren.length !== uniqueChildIds.length
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid child selection" },
        { status: 400 },
      );
    }

    const normalizedPickup = normalizeBookingLocation(pickupLocation);
    const normalizedDropoff = normalizeBookingLocation(dropoffLocation);
    const hasPickup = pickupLocation !== undefined && pickupLocation !== null;
    const hasDropoff = dropoffLocation !== undefined && dropoffLocation !== null;
    if (hasPickup !== hasDropoff || (hasPickup && (!normalizedPickup || !normalizedDropoff))) {
      return NextResponse.json(
        { success: false, message: "Enter valid pick-up and drop-off locations." },
        { status: 400 },
      );
    }

    const bookedChildren = selectedChildren.map((child: any) => ({
      childRef: child._id,
      name: child.name,
      age: child.age,
      school: child.school,
      gender: child.gender,
      pickupLocation: normalizedPickup ?? child.pickupLocation,
      dropoffLocation: normalizedDropoff ?? child.dropoffLocation,
    }));
    const activeDuplicateCandidates = await Booking.find({
      parent: user.id,
      driver: driver._id,
      bookingType,
      status: { $in: ["pending", "driver_assigned", "accepted", "in_progress"] },
      "children.childRef": { $all: selectedChildren.map((child: any) => child._id) },
      children: { $size: selectedChildren.length },
    }).select("tripDate direction returnTime recurringMeta");

    if (bookingType === "recurring") {
      if (!recurringDays?.length || !startDate || !endDate || !morningTime) {
        return NextResponse.json(
          {
            success: false,
            message:
              "recurringDays, startDate, endDate, and morningTime are required for term bookings.",
          },
          { status: 400 },
        );
      }

      const start = new Date(`${startDate}T${morningTime}:00`);
      const end = new Date(`${endDate}T23:59:59`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return NextResponse.json(
          { success: false, message: "Enter a valid term date range." },
          { status: 400 },
        );
      }

      const requestedDays = Array.from(new Set(recurringDays)).sort();
      const duplicate = activeDuplicateCandidates.some((candidate) => {
        const existingDays = [...(candidate.recurringMeta?.days ?? [])].sort();
        return (
          candidate.recurringMeta?.startDate === startDate &&
          candidate.recurringMeta?.endDate === endDate &&
          candidate.recurringMeta?.morningTime === morningTime &&
          candidate.recurringMeta?.eveningTime === (eveningTime || null) &&
          candidate.direction === direction &&
          existingDays.length === requestedDays.length &&
          existingDays.every((day, index) => day === requestedDays[index])
        );
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "This term booking is already active." },
          { status: 409 },
        );
      }

      const requestKey = createHash("sha256")
        .update(JSON.stringify({
          driverId: driver._id.toString(),
          childIds: uniqueChildIds.sort(),
          bookingType,
          direction,
          startDate,
          endDate,
          requestedDays,
          morningTime,
          eveningTime: eveningTime || null,
        }))
        .digest("hex");

      const firstDate = start;

      const booking = await Booking.create({
        driver: driver._id,
        parent: user.id,
        children: bookedChildren,
        seatsBooked: bookedChildren.length,
        bookingType: "recurring",
        requestKey,
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

    const requestedTripDate = new Date(tripDate);
    if (Number.isNaN(requestedTripDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Enter a valid trip date." },
        { status: 400 },
      );
    }
    const duplicate = activeDuplicateCandidates.some(
      (candidate) =>
        candidate.tripDate.getTime() === requestedTripDate.getTime() &&
        candidate.direction === direction &&
        candidate.returnTime === (returnTime || null),
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "This booking request is already active." },
        { status: 409 },
      );
    }

    const requestKey = createHash("sha256")
      .update(JSON.stringify({
        driverId: driver._id.toString(),
        childIds: uniqueChildIds.sort(),
        bookingType,
        direction,
        tripDate: requestedTripDate.toISOString(),
        returnTime: returnTime || null,
      }))
      .digest("hex");

    const booking = await Booking.create({
      driver: driver._id,
      parent: user.id,
      children: bookedChildren,
      seatsBooked: bookedChildren.length,
      bookingType: "one_time",
      requestKey,
      direction,
      tripDate: requestedTripDate,
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
    if ((error as any)?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "This booking request is already active." },
        { status: 409 },
      );
    }
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
