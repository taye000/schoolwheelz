import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
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

        const parent = await Parent.findById(user.id);
        if (!parent) {
          return res
            .status(404)
            .json({ success: false, message: "Parent not found" });
        }

        const validChildren = parent.children.map((c: any) => c._id.toString());
        const isValid = children.every((c: any) =>
          validChildren.includes(c._id?.toString())
        );

        if (!isValid) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid child selection" });
        }

        const booking = await Booking.create({
          driver: driver._id,
          parent: user.id,
          children,
          seatsBooked,
          tripDate,
          status: "pending",
        });

        await booking.populate([
          { path: "driver" },
          { path: "parent" },
        ]);

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
