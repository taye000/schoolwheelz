import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";
import mongoose from "mongoose";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        if (!mongoose.Types.ObjectId.isValid(id as string)) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid parent ID." });
        }

        const parent = await Parent.findById(id);
        if (!parent) {
          return res
            .status(404)
            .json({ success: false, error: "Parent not found." });
        }

        res.status(200).json({ success: true, data: parent });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch parent." });
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
