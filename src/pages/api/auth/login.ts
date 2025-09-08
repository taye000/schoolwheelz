import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "POST":
      try {
        const { password, userType } = req.body;
        const email = req.body.email.toLowerCase();

        if (!["parent", "driver"].includes(userType)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid user type" });
        }

        let user;
        if (userType === "parent") {
          user = await Parent.findOne({ email });
        } else if (userType === "driver") {
          user = await Driver.findOne({ email });
        }

        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
          {
            id: user._id,
            userType: user.userType,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: "1h" }
        );

        res.setHeader(
          "Set-Cookie",
          serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
          })
        );

        const { password: _, ...safeUser } = user.toObject();

        res.status(200).json({ success: true, data: safeUser });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
