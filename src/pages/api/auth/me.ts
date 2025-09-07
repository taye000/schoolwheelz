import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const token = req.cookies.token;
        if (!token) {
          return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string;
            userType: string;
          };
        } catch (err) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid token" });
        }

        let user;
        if (decoded.userType === "parent") {
          user = await Parent.findById(decoded.id).select("-password");
        } else if (decoded.userType === "driver") {
          user = await Driver.findById(decoded.id).select("-password");
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Invalid user type" });
        }

        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
      } catch (err) {
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
