import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Review from "@/models/Review";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  switch (req.method) {
    case "GET":
      try {
        const { id } = req.query;
        const reviews = await Review.find({ driver: id })
          .populate("parent", "fullName email")
          .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: reviews });
      } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: "Server error" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
