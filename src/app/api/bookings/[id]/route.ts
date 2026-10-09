export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { getAuthUser } from "@/utils/authApp";
import { bookingsShareTripSlot } from "@/utils/bookingSlots";

const DURATIONS = ["semester", "month", "week", "one_off"];
const BOOKING_TYPES = ["one_time", "recurring"];
const DIRECTIONS = ["morning", "evening", "both"];
const STATUSES = ["pending", "driver_assigned", "accepted", "in_progress", "completed", "canceled"];

function normalizeChildren(input: any[], existingChildren: any[]) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 30) return null;
  const existingById = new Map(existingChildren.map((child) => [child._id.toString(), child]));
  const children = [];
  for (const child of input) {
    const name = typeof child.name === "string" ? child.name.trim() : "";
    const school = typeof child.school === "string" ? child.school.trim() : "";
    const age = Number(child.age);
    const gender = typeof child.gender === "string" ? child.gender.trim() : "";
    if (!name || name.length > 100 || !school || school.length > 160 || !Number.isInteger(age) || age < 1 || age > 20 || !gender || gender.length > 40) {
      return null;
    }
    const existing = child._id ? existingById.get(String(child._id)) : undefined;
    children.push({
      ...(existing?.toObject?.() ?? {}),
      ...(existing ? { _id: existing._id } : {}),
      childRef: child.childRef ?? existing?.childRef,
      name,
      age,
      school,
      gender,
      guardianNotes: typeof child.guardianNotes === "string" ? child.guardianNotes.trim().slice(0, 1000) : "",
      pickupLocation: child.pickupLocation ?? existing?.pickupLocation,
      dropoffLocation: child.dropoffLocation ?? existing?.dropoffLocation,
      pickedUp: existing?.pickedUp ?? false,
      droppedOff: existing?.droppedOff ?? false,
      pickupTime: existing?.pickupTime,
      dropoffTime: existing?.dropoffTime,
      driverNote: existing?.driverNote,
      driverRating: existing?.driverRating,
    });
  }
  return children;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const booking = await Booking.findById(params.id);
    if (!booking) return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });

    if (user.userType === "parent") {
      if (booking.parent.toString() !== user.id) {
        return NextResponse.json({ success: false, message: "Not your booking." }, { status: 403 });
      }
      if (["in_progress", "completed", "canceled"].includes(booking.status)) {
        return NextResponse.json({ success: false, message: "Children can no longer be edited for this booking." }, { status: 409 });
      }

      const children = normalizeChildren(body.children, booking.children);
      if (!children) {
        return NextResponse.json({ success: false, message: "Add at least one child with a valid name, age, school, and gender." }, { status: 400 });
      }
      const parent = await Parent.findById(user.id);
      const driver = await Driver.findById(booking.driver).select("cars");
      if (!parent || !driver) return NextResponse.json({ success: false, message: "Booking participants not found." }, { status: 404 });

      for (const child of children) {
        let profileChild = child.childRef && mongoose.Types.ObjectId.isValid(child.childRef.toString())
          ? parent.children.id(child.childRef)
          : undefined;
        if (child.childRef && !profileChild) {
          return NextResponse.json({ success: false, message: "A selected child does not belong to your profile." }, { status: 403 });
        }
        if (!profileChild) {
          profileChild = parent.children.find((candidate: any) =>
            candidate.name.trim().toLowerCase() === child.name.toLowerCase() &&
            candidate.school.trim().toLowerCase() === child.school.toLowerCase(),
          );
        }
        if (profileChild) {
          profileChild.name = child.name;
          profileChild.age = child.age;
          profileChild.school = child.school;
          profileChild.gender = child.gender;
          child.childRef = profileChild._id;
        } else {
          const createdChild = parent.children.create({
            name: child.name,
            age: child.age,
            school: child.school,
            gender: child.gender,
          });
          parent.children.push(createdChild);
          child.childRef = createdChild._id;
        }
      }

      const activeCar = driver.cars.find((car: any) => car.isActive);
      const reservations = await Booking.find({
        driver: booking.driver,
        _id: { $ne: booking._id },
        status: { $in: ["accepted", "in_progress"] },
        isDeleted: false,
      }).select("bookingType tripDate recurringMeta direction returnTime seatsBooked");
      const committedSeats = reservations
        .filter((reservation: any) => bookingsShareTripSlot(booking, reservation))
        .reduce((sum: number, reservation: any) => sum + (reservation.seatsBooked ?? 0), 0);
      if (!activeCar || children.length + committedSeats > activeCar.availableSeats) {
        return NextResponse.json({ success: false, message: `Only ${Math.max(0, (activeCar?.availableSeats ?? 0) - committedSeats)} seats remain for this slot.` }, { status: 409 });
      }

      booking.children = children as any;
      booking.seatsBooked = children.length;
      if (booking.adminReviewStatus === "approved" || booking.status === "accepted") {
        booking.adminReviewStatus = "awaiting_admin";
        booking.adminReviewNote = "Updated by parent; billing review required.";
        booking.status = "pending";
        booking.totalAmount = undefined;
        booking.amountIncurred = 0;
        booking.dueDate = undefined;
      }
      await parent.save();
      await booking.save();
    } else if (user.userType === "admin") {
      if (body.children !== undefined) {
        const children = normalizeChildren(body.children, booking.children);
        if (!children) return NextResponse.json({ success: false, message: "Invalid child details." }, { status: 400 });
        booking.children = children as any;
        booking.seatsBooked = children.length;
      }
      if (body.bookingDuration !== undefined) {
        if (!DURATIONS.includes(body.bookingDuration)) return NextResponse.json({ success: false, message: "Invalid booking duration." }, { status: 400 });
        booking.bookingDuration = body.bookingDuration;
      }
      if (body.bookingType !== undefined) {
        if (!BOOKING_TYPES.includes(body.bookingType)) return NextResponse.json({ success: false, message: "Invalid booking type." }, { status: 400 });
        booking.bookingType = body.bookingType;
      }
      if (body.direction !== undefined) {
        if (!DIRECTIONS.includes(body.direction)) return NextResponse.json({ success: false, message: "Invalid trip direction." }, { status: 400 });
        booking.direction = body.direction;
      }
      if (body.tripDate !== undefined) {
        const tripDate = new Date(body.tripDate);
        if (Number.isNaN(tripDate.getTime())) return NextResponse.json({ success: false, message: "Invalid trip date." }, { status: 400 });
        booking.tripDate = tripDate;
      }
      if (body.recurringMeta !== undefined) booking.recurringMeta = body.recurringMeta;
      if (body.returnTime !== undefined) booking.returnTime = body.returnTime || null;
      for (const field of ["totalAmount", "amountIncurred"] as const) {
        if (body[field] !== undefined) {
          const value = Number(body[field]);
          if (!Number.isFinite(value) || value < 0) return NextResponse.json({ success: false, message: `Invalid ${field}.` }, { status: 400 });
          booking[field] = value;
        }
      }
      if (body.dueDate !== undefined) {
        const dueDate = new Date(body.dueDate);
        if (Number.isNaN(dueDate.getTime())) return NextResponse.json({ success: false, message: "Invalid due date." }, { status: 400 });
        booking.dueDate = dueDate;
      }
      if (body.adminReviewNote !== undefined) booking.adminReviewNote = String(body.adminReviewNote).trim().slice(0, 1000);
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return NextResponse.json({ success: false, message: "Invalid booking status." }, { status: 400 });
        booking.status = body.status;
      }
      if (body.driverId !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(body.driverId) || !await Driver.exists({ _id: body.driverId })) {
          return NextResponse.json({ success: false, message: "Invalid driver." }, { status: 400 });
        }
        booking.driver = body.driverId;
      }
    } else {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    await booking.populate([{ path: "driver" }, { path: "parent" }]);
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Could not update this booking." }, { status: 500 });
  }
}