/**
 * TalkSasa SMS service (bulksms.talksasa.com).
 *
 * This module is server-only (never import it in client components).
 * Usage:
 *   import { sendSMS } from "@/utils/sms";
 *   await sendSMS("+254712345678", "Your booking has been confirmed.");
 *   await sendSMS(["+254712345678", "+254798765432"], "Driver is on the way!", { eventType: "trip_started", bookingId: "..." });
 *
 * Every send attempt (success or failure) is written to the SmsLog collection
 * as a fire-and-forget operation so it never blocks the main request.
 */

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSContext {
  /** Logical event name, e.g. "booking_accepted", "trip_started" */
  eventType?: string;
  /** Booking._id string this SMS relates to */
  bookingId?: string;
  /** User._id who triggered the action (omit for system-generated messages) */
  triggeredBy?: string;
}

/** Persist an SMS log entry in the background — never throws */
async function persistLog(
  to: string[],
  message: string,
  result: SMSResult,
  ctx: SMSContext,
): Promise<void> {
  try {
    // Dynamic imports so this module can be used before DB is connected
    const { default: dbConnect } = await import("@/utils/dbConnect");
    const { default: SmsLog } = await import("@/models/SmsLog");
    await dbConnect();
    await SmsLog.create({
      to,
      message,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.messageId,
      error: result.error,
      eventType: ctx.eventType,
      bookingId: ctx.bookingId,
      triggeredBy: ctx.triggeredBy,
    });
  } catch (logErr) {
    // Logging should never crash the caller
    console.error("[SMS] Failed to persist log:", logErr);
  }
}

/**
 * Send an SMS to one or more recipients via TalkSasa.
 *
 * @param to       E.164 phone number(s), e.g. "+254712345678"
 * @param message  Plain-text message body
 * @param ctx      Optional context for the audit log (eventType, bookingId, triggeredBy)
 * @returns        Result with success flag and optional messageId or error
 */
export async function sendSMS(
  to: string | string[],
  message: string,
  ctx: SMSContext = {},
): Promise<SMSResult> {
  const recipients = Array.isArray(to) ? to : [to];

  const apiKey = process.env.TALKSASA_API_KEY;
  const senderId = process.env.TALKSASA_SENDER_ID;

  if (!apiKey || !senderId) {
    const err =
      "TalkSasa credentials missing. Set TALKSASA_API_KEY and TALKSASA_SENDER_ID in .env.local.";
    console.error("[SMS]", err);
    const result: SMSResult = { success: false, error: err };
    persistLog(recipients, message, result, ctx); // fire and forget
    return result;
  }

  try {
    const response = await fetch(
      "https://bulksms.talksasa.com/api/v3/sms/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recipient: recipients.join(","),
          sender_id: senderId,
          type: "plain",
          message,
        }),
      },
    );

    const data = (await response.json()) as {
      status: string;
      data?: string;
      message?: string;
    };

    if (data.status === "success") {
      const result: SMSResult = {
        success: true,
        messageId:
          typeof data.data === "string" ? data.data.slice(0, 100) : undefined,
      };
      persistLog(recipients, message, result, ctx);
      return result;
    }

    const errMsg = data.message ?? `HTTP ${response.status}: ${data.status}`;
    console.error("[SMS] TalkSasa error:", errMsg);
    const result: SMSResult = { success: false, error: errMsg };
    persistLog(recipients, message, result, ctx);
    return result;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[SMS] Send failed:", errMsg);
    const result: SMSResult = { success: false, error: errMsg };
    persistLog(recipients, message, result, ctx);
    return result;
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
