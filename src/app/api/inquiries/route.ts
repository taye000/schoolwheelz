export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Inquiry from "@/models/Inquiry";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const school = typeof body.school === "string" ? body.school.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (
      name.length < 2 || name.length > 80 ||
      (!email && !phone) || !validEmail ||
      phone.length > 40 || school.length > 120 ||
      message.length < 10 || message.length > 1500
    ) {
      return NextResponse.json(
        { success: false, message: "Check your contact details and message, then try again." },
        { status: 400 },
      );
    }

    await Inquiry.create({ name, email, phone, school, message });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Could not send your inquiry." }, { status: 500 });
  }
}