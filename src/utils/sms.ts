/**
 * Africa's Talking SMS service.
 *
 * This module is server-only (never import it in client components).
 * Usage:
 *   import { sendSMS } from "@/utils/sms";
 *   await sendSMS("+254712345678", "Your booking has been confirmed.");
 *   await sendSMS(["+254712345678", "+254798765432"], "Driver is on the way!");
 */

import AfricasTalking from "africastalking";

let _client: ReturnType<typeof AfricasTalking> | null = null;

function getClient() {
  if (_client) return _client;

  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;

  if (!username || !apiKey) {
    throw new Error(
      "Africa's Talking credentials are missing. Set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY in .env.local.",
    );
  }

  _client = AfricasTalking({ username, apiKey });
  return _client;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS to one or more recipients.
 *
 * @param to       E.164 phone number(s), e.g. "+254712345678"
 * @param message  Plain-text message body (max 160 chars per SMS segment)
 * @returns        Result with success flag and optional messageId or error
 */
export async function sendSMS(
  to: string | string[],
  message: string,
): Promise<SMSResult> {
  try {
    const client = getClient();
    const sms = client.SMS;

    const senderId = process.env.AFRICASTALKING_SENDER_ID || undefined;
    const recipients = Array.isArray(to) ? to : [to];

    const response = (await sms.send({
      to: recipients,
      message,
      from: senderId ?? "",
    })) as unknown as {
      SMSMessageData: {
        Recipients: Array<{
          statusCode: number;
          messageId: string;
          status: string;
        }>;
      };
    };

    const result = response?.SMSMessageData?.Recipients?.[0];
    const statusCode = result?.statusCode;

    // Africa's Talking uses statusCode 101 for "Sent" and 102 for "Queued"
    if (statusCode === 101 || statusCode === 102) {
      return { success: true, messageId: result?.messageId };
    }

    return {
      success: false,
      error: result?.status ?? "Unknown error from Africa's Talking",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SMS] Send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Pre-built message templates.
 * Import whichever you need alongside sendSMS.
 */
export const SmsTemplates = {
  bookingConfirmed: (driverName: string, time: string) =>
    `Your School Wheelz booking is confirmed. ${driverName} will pick up your child at ${time}. Safe travels!`,

  bookingAccepted: (parentName: string, driverName: string) =>
    `Hi ${parentName}, driver ${driverName} has accepted your booking. You'll be notified when they're on the way.`,

  driverOnTheWay: (driverName: string, minutes: number) =>
    `${driverName} is on the way and will arrive in approximately ${minutes} minutes. Please have your child ready.`,

  bookingCancelled: (reason?: string) =>
    `Your School Wheelz booking has been cancelled.${reason ? ` Reason: ${reason}` : ""} Please re-book at your convenience.`,

  bookingRejected: (driverName: string, reason?: string) =>
    `Sorry, driver ${driverName} is unable to take your booking.${reason ? ` Reason: ${reason}.` : ""} Please choose another driver on School Wheelz.`,

  childDroppedOff: (childName: string, school: string) =>
    `${childName} has been safely dropped off at ${school}. Have a great day!`,

  childPickedUp: (childName: string, driverName: string) =>
    `${childName} has been picked up by ${driverName} and is on the way to school.`,

  arrivedAtSchool: (childName: string, school: string) =>
    `${childName} has arrived safely at ${school}. Have a great day!`,
} as const;
