export const dynamic = "force-dynamic";
import { randomBytes, scryptSync, createCipheriv } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Driver from "@/models/DriversRegistration";
import DriverDocument, { DriverDocumentType } from "@/models/DriverDocument";
import { getAuthUser } from "@/utils/authApp";

const DOCUMENT_TYPES: DriverDocumentType[] = ["idFront", "idBack", "license", "goodConduct"];
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function canAccess(user: { id: string; userType: string }, driverId: string) {
  return user.id === driverId && user.userType === "driver" || user.userType === "admin";
}

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return scryptSync(secret, "schoolwheelz:driver-documents", 32);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (!mongoose.Types.ObjectId.isValid(params.id) || !canAccess(user, params.id)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const documents = await DriverDocument.find({ driver: params.id })
    .select("type fileName mimeType createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, data: documents });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const user = getAuthUser(req);
  if (user instanceof NextResponse) return user;
  if (user.userType !== "driver" || user.id !== params.id) {
    return NextResponse.json({ success: false, message: "Only the driver can upload their documents." }, { status: 403 });
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid driver ID." }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const type = formData.get("type");
    const file = formData.get("file");
    if (
      typeof type !== "string" || !DOCUMENT_TYPES.includes(type as DriverDocumentType) ||
      !(file instanceof File) || !ALLOWED_MIME_TYPES.includes(file.type) ||
      file.size === 0 || file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { success: false, message: "Upload a PDF, JPEG, or PNG file no larger than 5 MB." },
        { status: 400 },
      );
    }

    const driverExists = await Driver.exists({ _id: params.id });
    if (!driverExists) {
      return NextResponse.json({ success: false, message: "Driver not found." }, { status: 404 });
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    const encryptedData = Buffer.concat([
      cipher.update(Buffer.from(await file.arrayBuffer())),
      cipher.final(),
    ]);
    const safeName = file.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 150);
    const document = await DriverDocument.findOneAndUpdate(
      { driver: params.id, type },
      {
        $set: {
          fileName: safeName || "document",
          mimeType: file.type,
          encryptedData,
          iv: iv.toString("hex"),
          authTag: cipher.getAuthTag().toString("hex"),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).select("type fileName mimeType createdAt");

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Could not securely store this document." }, { status: 500 });
  }
}