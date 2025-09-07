import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await dbConnect();
    res
      .status(200)
      .json({ success: true, message: "Database connection successful!" });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: "Database connection failed.",
        error: error.message,
      });
  }
}
