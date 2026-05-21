import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/upload
 * Body: JSON { folder: string }
 *
 * Returns a short-lived Cloudinary signed-upload signature so the browser
 * can upload directly to Cloudinary without proxying the file through our server.
 */
export async function POST(req: NextRequest) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on this server." },
      { status: 500 },
    );
  }

  let folder = "schoolwheelz";
  try {
    const body = await req.json();
    if (body?.folder) folder = String(body.folder);
  } catch {
    // no body / not JSON — use default folder
  }

  const timestamp = Math.round(Date.now() / 1000);
  // params must be sorted alphabetically for the signature
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return NextResponse.json({ signature, apiKey, timestamp, cloudName, folder });
}
