import type {
  NotificationTargetType,
  NotificationType,
} from "@/generated/prisma/client";

export interface NotificationActorRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  membershipStatus: string;
  role: string;
}

export interface NotificationRow {
  id: string;
  type: NotificationType;
  actorId: string | null;
  title: string;
  body: string | null;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  actor: NotificationActorRow | null;
}

export interface SerializedNotification {
  id: string;
  type: NotificationType;
  actorLabel: string | null;
  title: string;
  body: string | null;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  read: boolean;
  createdAt: string;
}

export function serializeNotification(
  row: NotificationRow,
): SerializedNotification {
  return {
    id: row.id,
    type: row.type,
    actorLabel:
      row.actor?.displayName && row.actor.displayName.trim().length > 0
        ? row.actor.displayName
        : null,
    title: row.title,
    body: row.body,
    targetType: row.targetType,
    targetId: row.targetId,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}