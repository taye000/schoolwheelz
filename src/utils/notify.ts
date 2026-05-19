/**
 * In-app notification service.
 * Fire-and-forget — never throws so it never breaks the calling route.
 */
import dbConnect from "@/utils/dbConnect";
import Notification, { NotificationType } from "@/models/Notification";

interface CreateNotificationParams {
  userId: string;
  userType: "parent" | "driver" | "admin";
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  resourceId?: string;
  resourceType?: string;
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  try {
    await dbConnect();
    await Notification.create(params);
  } catch (err) {
    console.error("[notify]", err);
  }
}

/** Create multiple notifications in one call */
export async function createNotifications(
  items: CreateNotificationParams[],
): Promise<void> {
  try {
    await dbConnect();
    await Notification.insertMany(items);
  } catch (err) {
    console.error("[notify:bulk]", err);
  }
}
