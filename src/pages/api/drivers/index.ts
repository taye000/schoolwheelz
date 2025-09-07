import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
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
        const drivers = await Driver.find({});
        res.status(200).json({ success: true, data: drivers });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch drivers." });
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
