export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Contact from "@/models/Contact";
import { sendEmail } from "@/utils/sms";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const { fullName, email, phoneNumber, message } = body ?? {};

    if (
      !message ||
      (typeof email !== "string" && typeof phoneNumber !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a message and at least one contact method.",
        },
        { status: 400 },
      );
    }

    const contact = await Contact.create({
      fullName: fullName?.trim() || undefined,
      email: email?.trim() || undefined,
      phoneNumber: phoneNumber?.trim() || undefined,
      message: message.trim(),
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: "New contact form message",
          text: `Name: ${fullName || "N/A"}\nEmail: ${email || "N/A"}\nPhone: ${phoneNumber || "N/A"}\n\nMessage:\n${message}`,
        });
      } catch (emailError) {
        console.error("Failed to send contact email", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thanks for reaching out. We received your message.",
      data: contact,
    });
  } catch (error) {
    console.error("contact form error", error);
    return NextResponse.json(
      { success: false, message: "Unable to save your message right now." },
      { status: 500 },
    );
  }
}
