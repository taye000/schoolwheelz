/**
 * Audit logging service.
 * Call log() from any API route after a mutation succeeds.
 * Fire-and-forget — never throws so it never breaks the main response.
 */
import dbConnect from "@/utils/dbConnect";
import AuditLog, { AuditAction } from "@/models/AuditLog";

interface LogParams {
  actorId: string;
  actorType: "driver" | "parent" | "admin";
  actorName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

export async function log(params: LogParams): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      actor: params.actorId,
      actorType: params.actorType,
      actorName: params.actorName,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      detail: params.detail,
      meta: params.meta,
    });
  } catch (err) {
    // Never surface audit failures to the caller
    console.error("[audit]", err);
  }
}
