import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Parent from "@/models/ParentsRegistration";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "POST":
      try {
        const parent = await Parent.create(req.body);
        res.status(201).json({ success: true, data: parent });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
