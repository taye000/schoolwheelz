import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import { authenticate } from "@/utils/auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  switch (req.method) {
    case "PATCH":
      try {
        const user = (req as any).user;

        if (user.userType !== "driver") {
          return res
            .status(403)
            .json({ success: false, message: "Only drivers can cancel bookings" });
        }

        const { id } = req.query;
        const booking = await Booking.findById(id).populate("driver");

        if (!booking) {
          return res
            .status(404)
            .json({ success: false, message: "Booking not found" });
        }

        // Parent can cancel their own booking, driver can cancel theirs
        if (
          user.userType === "parent" &&
          booking.parent.toString() !== user.id
        ) {
          return res
            .status(403)
            .json({ success: false, message: "Not your booking" });
        }
        if (
          user.userType === "driver" &&
          booking.driver._id.toString() !== user.id
        ) {
          return res
            .status(403)
            .json({ success: false, message: "Not your booking" });
        }

        if (booking.status === "canceled") {
          return res
            .status(400)
            .json({ success: false, message: "Already canceled" });
        }

        // restore seats if it was accepted
        if (booking.status === "accepted") {
          const driver = await Driver.findById(booking.driver._id);
          if (driver) {
            driver.availableSeats += booking.seatsBooked;
            await driver.save();
          }
        }

        booking.status = "canceled";
        await booking.save();

        res.status(200).json({ success: true, data: booking });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    default:
      res.setHeader("Allow", ["PATCH"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default authenticate(handler);
