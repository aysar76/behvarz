import type {
  CircleInviteStatus,
  CircleJoinRequestStatus,
  CircleMembershipRole,
  CircleStatus,
} from "@/generated/prisma/client";

export const CIRCLE_MIN_CAPACITY = 5;
export const CIRCLE_MAX_CAPACITY = 12;
export const CIRCLE_MAX_NAME_LENGTH = 80;
export const CIRCLE_MAX_DESCRIPTION_LENGTH = 800;
export const CIRCLE_MAX_TOPIC_LENGTH = 80;
export const CIRCLE_MAX_MEETING_TITLE_LENGTH = 120;
export const CIRCLE_MAX_AGENDA_LENGTH = 800;
export const CIRCLE_MAX_MEETING_SUMMARY_LENGTH = 2000;

export const CIRCLE_STATUS_LABELS: Record<CircleStatus, string> = {
  active: "فعال",
  archived: "بایگانی‌شده",
};

export const CIRCLE_MEMBERSHIP_ROLE_LABELS: Record<
  CircleMembershipRole,
  string
> = {
  member: "عضو",
  facilitator: "راهبر",
};

export const CIRCLE_JOIN_REQUEST_STATUS_LABELS: Record<
  CircleJoinRequestStatus,
  string
> = {
  pending: "در انتظار تأیید",
  approved: "تأییدشده",
  rejected: "ردشده",
  canceled: "لغوشده",
};

export const CIRCLE_INVITE_STATUS_LABELS: Record<CircleInviteStatus, string> = {
  pending: "در انتظار پاسخ",
  accepted: "پذیرفته‌شده",
  declined: "ردشده",
};