export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { findUserByEmail } from "@/utils/accountLookup";
import { sendSMS } from "@/utils/sms";

const otpStore = new Map<string, { otp: string; expiresAt: number; userId: string; userType: string; phoneNumber: string }>();

function createOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  return `+${digits}`;
}

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const { email, userType = "parent" } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const user = await findUserByEmail(email.toLowerCase(), userType);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const phoneNumber = normalizePhone(user.phoneNumber || "");
    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "No phone number is registered" }, { status: 400 });
    }

    const otp = createOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const key = `${email.toLowerCase()}:${userType}`;
    otpStore.set(key, { otp, expiresAt, userId: user._id.toString(), userType, phoneNumber });

    const smsResult = await sendSMS(phoneNumber, `Your School Wheelz phone verification code is ${otp}. It expires in 10 minutes.`, {
      eventType: "phone_verification_otp",
      triggeredBy: user._id.toString(),
    });

    if (!smsResult.success) {
      otpStore.delete(key);
      return NextResponse.json({ success: false, message: smsResult.error ?? "Unable to send OTP" }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Verification code sent to your phone" });
  } catch (error) {
    console.error("verify-phone send error", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const { email, userType = "parent", otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 });
    }

    const key = `${email.toLowerCase()}:${userType}`;
    const record = otpStore.get(key);
    if (!record) {
      return NextResponse.json({ success: false, message: "No verification code found" }, { status: 404 });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 410 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 401 });
    }

    const user = await findUserByEmail(email.toLowerCase(), userType);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user._id.toString() !== record.userId) {
      return NextResponse.json({ success: false, message: "Verification mismatch" }, { status: 400 });
    }

    user.phoneVerified = true;
    await user.save();
    otpStore.delete(key);

    return NextResponse.json({ success: true, message: "Phone verified successfully" });
  } catch (error) {
    console.error("verify-phone confirm error", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
