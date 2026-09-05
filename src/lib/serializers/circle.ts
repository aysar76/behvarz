import type {
  CircleInviteStatus,
  CircleJoinRequestStatus,
  CircleMembershipRole,
  CircleMembershipStatus,
  CircleStatus,
} from "@/generated/prisma/client";

export interface CircleUserRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  membershipStatus: string;
}

export interface CircleMembershipRow {
  id: string;
  userId: string;
  role: CircleMembershipRole;
  status: CircleMembershipStatus;
  joinedAt: Date;
  user: CircleUserRow;
}

export interface CircleJoinRequestRow {
  id: string;
  userId: string;
  message: string | null;
  status: CircleJoinRequestStatus;
  createdAt: Date;
  user: CircleUserRow;
}

export interface CircleInviteRow {
  id: string;
  userId: string;
  message: string | null;
  status: CircleInviteStatus;
  createdAt: Date;
  user: CircleUserRow;
}

export interface CircleMeetingRow {
  id: string;
  title: string;
  agenda: string | null;
  scheduledAt: Date | null;
  summary: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; displayName: string | null };
}

export interface CircleRow {
  id: string;
  name: string;
  description: string;
  topic: string | null;
  province: string | null;
  capacity: number;
  status: CircleStatus;
  facilitatorId: string;
  createdAt: Date;
  updatedAt: Date;
  facilitator: CircleUserRow;
  memberships?: CircleMembershipRow[];
  joinRequests?: CircleJoinRequestRow[];
  invites?: CircleInviteRow[];
  meetings?: CircleMeetingRow[];
  _count?: { memberships: number };
}

export interface SerializedCircleMember {
  id: string;
  userId: string;
  role: CircleMembershipRole;
  displayName: string | null;
  province: string | null;
  city: string | null;
}

export interface SerializedCircleJoinRequest {
  id: string;
  userId: string;
  message: string | null;
  status: CircleJoinRequestStatus;
  createdAt: string;
  displayName: string | null;
  province: string | null;
}

export interface SerializedCircleInvite {
  id: string;
  userId: string;
  message: string | null;
  status: CircleInviteStatus;
  createdAt: string;
  displayName: string | null;
}

export interface SerializedCircleMeeting {
  id: string;
  title: string;
  agenda: string | null;
  scheduledAt: string | null;
  summary: string | null;
  createdByLabel: string;
  createdAt: string;
  isMine: boolean;
}

export interface SerializedCircle {
  id: string;
  name: string;
  description: string;
  topic: string | null;
  province: string | null;
  capacity: number;
  status: CircleStatus;
  facilitatorId: string;
  facilitatorLabel: string;
  createdAt: string;
  memberCount: number;
  members: SerializedCircleMember[];
  joinRequests: SerializedCircleJoinRequest[];
  invites: SerializedCircleInvite[];
  meetings: SerializedCircleMeeting[];
  isMember: boolean;
  isFacilitator: boolean;
  myJoinRequest: CircleJoinRequestStatus | null;
  myInvite: CircleInviteStatus | null;
}

export interface SerializeCircleOptions {
  currentUserId: string;
}

export function serializeCircle(
  row: CircleRow,
  options: SerializeCircleOptions,
): SerializedCircle {
  const members = (row.memberships ?? [])
    .filter((membership) => membership.status === "active")
    .map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      displayName: membership.user.displayName,
      province: membership.user.province,
      city: membership.user.city,
    }));

  const memberIds = new Set(members.map((member) => member.userId));
  const isMember = memberIds.has(options.currentUserId);
  const myMembership = (row.memberships ?? []).find(
    (membership) =>
      membership.userId === options.currentUserId &&
      membership.status === "active",
  );
  const isFacilitator = myMembership?.role === "facilitator";

  const myJoinRequest =
    (row.joinRequests ?? []).find(
      (request) => request.userId === options.currentUserId,
    )?.status ?? null;
  const myInvite =
    (row.invites ?? []).find(
      (invite) => invite.userId === options.currentUserId,
    )?.status ?? null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    topic: row.topic,
    province: row.province,
    capacity: row.capacity,
    status: row.status,
    facilitatorId: row.facilitatorId,
    facilitatorLabel: row.facilitator.displayName ?? "بی‌نام",
    createdAt: row.createdAt.toISOString(),
    memberCount:
      row._count?.memberships ??
      members.length,
    members,
    joinRequests: (row.joinRequests ?? []).map((request) => ({
      id: request.id,
      userId: request.userId,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      displayName: request.user.displayName,
      province: request.user.province,
    })),
    invites: (row.invites ?? []).map((invite) => ({
      id: invite.id,
      userId: invite.userId,
      message: invite.message,
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
      displayName: invite.user.displayName,
    })),
    meetings: (row.meetings ?? []).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      agenda: meeting.agenda,
      scheduledAt: meeting.scheduledAt?.toISOString() ?? null,
      summary: meeting.summary,
      createdByLabel: meeting.createdBy.displayName ?? "بی‌نام",
      createdAt: meeting.createdAt.toISOString(),
      isMine: meeting.createdById === options.currentUserId,
    })),
    isMember,
    isFacilitator,
    myJoinRequest,
    myInvite,
  };
}