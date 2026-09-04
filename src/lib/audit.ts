import { prisma } from "@/lib/db";

export interface AuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: unknown;
  ip?: string | null;
}

export async function auditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      details:
        input.details === undefined ? null : JSON.stringify(input.details),
      ip: input.ip ?? null,
    },
  });
}
