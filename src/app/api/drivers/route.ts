export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import Booking from "@/models/Booking";
import { bookingsShareTripSlot } from "@/utils/bookingSlots";
import "@/models/School"; // ensure School model is registered for populate

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const schoolId = searchParams.get("school"); // filter by school ObjectId
    const q = searchParams.get("q")?.trim(); // free-text: driver name or estate
    const slotStart = searchParams.get("startDate") ?? searchParams.get("tripDate");
    const slotEnd = searchParams.get("endDate") ?? slotStart;
    const slotTime = searchParams.get("time");
    const duration = searchParams.get("duration") ?? "semester";
    const direction = searchParams.get("direction") ?? "morning";

    const filter: Record<string, unknown> = { isProfileActive: true, liveStatus: "online" };
    if (schoolId) filter.schools = schoolId;
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { estate: { $regex: q, $options: "i" } },
      ];
    }

    let drivers = await Driver.find(filter)
      .populate("schools", "name estate")
      .skip((page - 1) * limit)
      .limit(limit);

    const hasSlotQuery = Boolean(schoolId && slotStart && slotEnd && slotTime);
    if (hasSlotQuery) {
      const driverIds = drivers.map((driver) => driver._id);
      const reservations = await Booking.find({
        driver: { $in: driverIds },
        status: { $in: ["accepted", "in_progress"] },
        isDeleted: false,
      }).select("driver bookingType tripDate recurringMeta direction returnTime seatsBooked");
      const request = {
        bookingType: duration === "one_off" ? "one_time" : "recurring",
        tripDate: new Date(`${slotStart}T${slotTime}:00+03:00`),
        recurringMeta: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startDate: slotStart,
          endDate: slotEnd,
          morningTime: direction === "morning" ? slotTime : "",
          eveningTime: direction === "evening" ? slotTime : null,
        },
        direction,
        returnTime: direction === "evening" ? slotTime : null,
      };

      drivers = drivers.map((driver: any) => {
        const activeCar = driver.cars?.find((car: any) => car.isActive);
        const slotBookedSeats = reservations
          .filter((booking: any) =>
            booking.driver.toString() === driver._id.toString() &&
            bookingsShareTripSlot(request, booking),
          )
          .reduce((total: number, booking: any) => total + (booking.seatsBooked ?? 0), 0);
        const slotCapacity = activeCar?.availableSeats ?? 0;
        return {
          ...driver.toObject(),
          slotCapacity,
          slotBookedSeats,
          slotAvailableSeats: Math.max(0, slotCapacity - slotBookedSeats),
        };
      }) as any;
    }

    const total = await Driver.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: drivers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch drivers." },
      { status: 500 },
    );
  }
}
