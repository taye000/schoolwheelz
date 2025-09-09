import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import { authenticate } from "@/utils/auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  switch (req.method) {
    case "POST":
      try {
        const user = (req as any).user;

        if (user.userType !== "parent") {
          return res
            .status(403)
            .json({ success: false, message: "Only parents can book" });
        }

        const { driverId, children, seatsBooked, tripDate } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
          return res
            .status(404)
            .json({ success: false, message: "Driver not found" });
        }

        if (driver.availableSeats < seatsBooked) {
          return res
            .status(400)
            .json({ success: false, message: "Not enough seats" });
        }

        const validChildren = user.children.map((c: any) => c.toString());
        const isValid = children.every((id: string) =>
          validChildren.includes(id)
        );

        if (!isValid) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid child selection" });
        }

        const booking = await Booking.create({
          driver: driver._id,
          parent: user.id,
          children: children.map((c: any) => c._id),
          seatsBooked,
          tripDate,
          status: "pending",
        });

        res.status(201).json({ success: true, data: booking });
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
