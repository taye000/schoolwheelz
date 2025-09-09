import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Review from "@/models/Review";
import Driver from "@/models/DriversRegistration";
import Booking from "@/models/Booking";
import { authenticate } from "@/utils/auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  switch (req.method) {
    case "POST":
      try {
        const user = (req as any).user;

        if (user.userType !== "parent") {
          return res
            .status(403)
            .json({ success: false, message: "Only parents can review" });
        }

        const { driverId, bookingId, rating, comment } = req.body;

        // Only allow review if booking was completed
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status !== "completed") {
          return res
            .status(400)
            .json({ success: false, message: "Cannot review yet" });
        }

        const review = await Review.create({
          driver: driverId,
          parent: user.id,
          rating,
          comment,
        });

        // Update driver's rating stats
        const driver = await Driver.findById(driverId);
        if (driver) {
          driver.averageRating =
            (driver.averageRating * driver.ratingCount + rating) /
            (driver.ratingCount + 1);
          driver.ratingCount += 1;
          await driver.save();
        }

        res.status(201).json({ success: true, data: review });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default authenticate(handler);
