import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  userType: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

export const authenticate = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const cookies = req.headers.cookie;
    const authHeader = cookies
      ? cookies
          .split(";")
          .find((c) => c.trim().startsWith("token="))
          ?.split("=")[1]
      : null;

    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      (req as any).user = decoded;

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  };
};
