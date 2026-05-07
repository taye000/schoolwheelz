export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Review from "@/models/Review";
import Driver from "@/models/DriversRegistration";
import Booking from "@/models/Booking";
import { getAuthUser } from "@/utils/authApp";

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;

  try {
    if (user.userType !== "parent") {
      return NextResponse.json(
        { success: false, message: "Only parents can review" },
        { status: 403 }
      );
    }

    const { driverId, bookingId, rating, comment } = await req.json();

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Cannot review this booking" },
        { status: 400 }
      );
    }

    const review = await Review.create({
      driver: driverId,
      parent: user.id,
      rating,
      comment,
    });

    const driver = await Driver.findById(driverId);
    if (driver) {
      driver.averageRating =
        (driver.averageRating * driver.ratingCount + rating) /
        (driver.ratingCount + 1);
      driver.ratingCount += 1;
      await driver.save();
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
