import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/models/Booking";
import Driver from "@/models/DriversRegistration";
import Parent from "@/models/ParentsRegistration";
import { authenticate } from "@/utils/auth";
import { generateBookingId } from "@/utils/generateBookingID";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const user = (req as any).user;

  switch (req.method) {
    // CREATE BOOKING
    case "POST":
      try {
        if (user.userType !== "parent") {
          return res
            .status(403)
            .json({ success: false, message: "Only parents can book" });
        }

        const { driverId, children, seatsBooked, tripDate } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver)
          return res
            .status(404)
            .json({ success: false, message: "Driver not found" });
        if (driver.availableSeats < seatsBooked)
          return res
            .status(400)
            .json({ success: false, message: "Not enough seats" });

        const parent = await Parent.findById(user.id);
        if (!parent)
          return res
            .status(404)
            .json({ success: false, message: "Parent not found" });

        const validChildren = parent.children.map((c: any) =>
          c._id?.toString()
        );
        const isValid = children.every((c: any) =>
          validChildren.includes(c._id?.toString())
        );
        if (!isValid)
          return res
            .status(400)
            .json({ success: false, message: "Invalid child selection" });

        const booking = await Booking.create({
          driver: driver._id,
          parent: user.id,
          children,
          seatsBooked,
          tripDate,
          status: "pending",
          bookingId: generateBookingId(),
        });

        await booking.populate([{ path: "driver" }, { path: "parent" }]);

        res.status(201).json({ success: true, data: booking });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    // FETCH BOOKINGS
    case "GET":
      try {
        const { id, all } = req.query;

        const baseFilter: any = { isDeleted: false };

        // Fetch booking by ID
        if (id) {
          const booking = await Booking.findOne({ _id: id, ...baseFilter })
            .populate("driver")
            .populate("parent");
          if (!booking)
            return res
              .status(404)
              .json({ success: false, message: "Booking not found" });
          return res.status(200).json({ success: true, data: booking });
        }

        // Fetch all bookings (admin only)
        if (all && user.userType === "admin") {
          const bookings = await Booking.find(baseFilter)
            .populate("driver")
            .populate("parent");
          return res.status(200).json({ success: true, data: bookings });
        }

        // Fetch bookings for current user (parent or driver)
        if (user.userType === "parent") {
          baseFilter.parent = new mongoose.Types.ObjectId(user.id);
        } else if (user.userType === "driver") {
          baseFilter.driver = new mongoose.Types.ObjectId(user.id);
        } else {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized" });
        }

        console.log("Filter:", baseFilter); // Debug log
        const bookings = await Booking.find(baseFilter)
          .populate("driver")
          .populate("parent");
        res.status(200).json({ success: true, data: bookings });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    // UPDATE BOOKING STATUS
    case "PUT":
      try {
        const { bookingId, status } = req.body;
        if (!bookingId || !status)
          return res.status(400).json({
            success: false,
            message: "bookingId and status are required",
          });

        const booking = await Booking.findOne({
          _id: bookingId,
          isDeleted: false,
        });
        if (!booking)
          return res
            .status(404)
            .json({ success: false, message: "Booking not found" });

        // Only admin or driver can update status
        if (!["admin", "driver"].includes(user.userType))
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized to update" });

        booking.status = status;
        await booking.save();
        await booking.populate([{ path: "driver" }, { path: "parent" }]);

        res.status(200).json({ success: true, data: booking });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    // SOFT DELETE BOOKING
    case "DELETE":
      try {
        const { bookingId } = req.query;
        if (!bookingId)
          return res
            .status(400)
            .json({ success: false, message: "bookingId is required" });

        const booking = await Booking.findOne({
          _id: bookingId,
          isDeleted: false,
        });
        if (!booking)
          return res
            .status(404)
            .json({ success: false, message: "Booking not found" });

        // Only parent can cancel
        if (user.userType !== "parent" || booking.parent.toString() !== user.id)
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized to cancel" });

        booking.isDeleted = true;
        await booking.save();

        res
          .status(200)
          .json({ success: true, message: "Booking cancelled (soft delete)" });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default authenticate(handler);
