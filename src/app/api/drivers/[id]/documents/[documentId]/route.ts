export const dynamic = "force-dynamic";
import { scryptSync, createDecipheriv } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import DriverDocument from "@/models/DriverDocument";
import { getAuthUser } from "@/utils/authApp";

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return scryptSync(secret, "schoolwheelz:driver-documents", 32);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; documentId: string } },
) {
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (
    (user.userType !== "admin" && (user.userType !== "driver" || user.id !== params.id)) ||
    !mongoose.Types.ObjectId.isValid(params.id) ||
    !mongoose.Types.ObjectId.isValid(params.documentId)
  ) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  await dbConnect();
  try {
    const document = await DriverDocument.findOne({ _id: params.documentId, driver: params.id });
    if (!document) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(document.iv, "hex"),
    );
    decipher.setAuthTag(Buffer.from(document.authTag, "hex"));
    const contents = Buffer.concat([
      decipher.update(document.encryptedData),
      decipher.final(),
    ]);
    const fileName = document.fileName.replace(/["\\\r\n]/g, "_");
    return new NextResponse(new Uint8Array(contents), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Could not open this document." }, { status: 500 });
  }
}