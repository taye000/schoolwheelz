import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  id: string;
  userType: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

/**
 * Extracts and verifies the JWT from the request cookie.
 * Returns the decoded payload or a 401 NextResponse.
 */
export function getAuthUser(
  req: NextRequest,
): AuthenticatedUser | NextResponse {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as AuthenticatedUser;
    return decoded;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 },
    );
  }
}
