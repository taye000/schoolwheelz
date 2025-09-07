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
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);

        const drivers = await Driver.find({})
          .skip((pageNumber - 1) * limitNumber)
          .limit(limitNumber);

        const totalDrivers = await Driver.countDocuments();

        res.status(200).json({
          success: true,
          data: drivers,
          pagination: {
            total: totalDrivers,
            page: pageNumber,
            pages: Math.ceil(totalDrivers / limitNumber),
          },
        });
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
