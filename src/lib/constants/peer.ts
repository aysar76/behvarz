import type {
  PeerCooperationReportReason,
  PeerCooperationReportStatus,
  PeerCooperationStatus,
  PeerHelpRequestStatus,
  PeerOfferStatus,
} from "@/generated/prisma/client";

export const PEER_HELP_MAX_TITLE_LENGTH = 120;
export const PEER_HELP_MAX_DESCRIPTION_LENGTH = 2000;
export const PEER_HELP_MAX_TAGS = 5;
export const PEER_OFFER_MAX_MESSAGE_LENGTH = 600;
export const PEER_COOP_MAX_GOAL_LENGTH = 800;
export const PEER_COOP_MAX_OUTCOME_LENGTH = 2000;
export const PEER_MESSAGE_MAX_LENGTH = 1000;
export const PEER_RATING_MAX = 5;
export const PEER_SUGGESTED_HELPERS_LIMIT = 5;
export const PEER_REPORT_MAX_NOTE_LENGTH = 500;

export const PEER_HELP_REQUEST_STATUS_LABELS: Record<
  PeerHelpRequestStatus,
  string
> = {
  open: "در انتظار همیار",
  matched: "همیار پیدا شد",
  completed: "تکمیل‌شده",
  closed: "بسته‌شده",
  canceled: "لغوشده",
};

export const PEER_OFFER_STATUS_LABELS: Record<PeerOfferStatus, string> = {
  pending: "در انتظار پاسخ",
  accepted: "پذیرفته‌شده",
  rejected: "ردشده",
  withdrawn: "پس‌گرفته‌شده",
};

export const PEER_COOPERATION_STATUS_LABELS: Record<
  PeerCooperationStatus,
  string
> = {
  active: "در جریان",
  completed: "تکمیل‌شده",
  closed: "بسته‌شده",
};

export const PEER_COOPERATION_REPORT_REASONS: {
  value: PeerCooperationReportReason;
  label: string;
}[] = [
  { value: "abusive", label: "رفتار توهین‌آمیز یا نامناسب" },
  { value: "harassment", label: "مزاحمت" },
  { value: "off_topic", label: "خروج از موضوع همکاری" },
  { value: "sensitive_info", label: "اشتراک اطلاعات حساس/بیمار" },
  { value: "other", label: "سایر" },
];

export const PEER_COOPERATION_REPORT_STATUS_LABELS: Record<
  PeerCooperationReportStatus,
  string
> = {
  pending: "در انتظار",
  resolved: "بررسی‌شده",
  rejected: "ردشده",
};