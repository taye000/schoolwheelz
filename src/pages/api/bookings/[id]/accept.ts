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
            .json({ success: false, message: "Only drivers can accept bookings" });
        }

        const { id } = req.query;
        const booking = await Booking.findById(id).populate("driver");

        if (!booking) {
          return res
            .status(404)
            .json({ success: false, message: "Booking not found" });
        }

        if (booking.driver._id.toString() !== user.id) {
          return res
            .status(403)
            .json({ success: false, message: "Not your booking" });
        }

        if (booking.status !== "pending") {
          return res
            .status(400)
            .json({ success: false, message: "Booking already processed" });
        }

        const driver = await Driver.findById(user.id);
        if (!driver)
          return res
            .status(404)
            .json({ success: false, message: "Driver not found" });

        if (driver.availableSeats < booking.seatsBooked) {
          return res
            .status(400)
            .json({ success: false, message: "Not enough seats" });
        }

        driver.availableSeats -= booking.seatsBooked;
        await driver.save();

        booking.status = "accepted";
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
