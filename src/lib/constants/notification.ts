import type {
  NotificationTargetType,
  NotificationType,
} from "@/generated/prisma/client";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  problem_answer: "پاسخ به مسئله",
  answer_mention: "اشاره به شما",
  solution_selected: "انتخاب راهکار شما",
  circle_join_accepted: "پذیرش در حلقه",
  circle_invite: "دعوت به حلقه",
  circle_meeting: "رویداد حلقه",
  cooperation_offer: "پیشنهاد همیاری",
  cooperation_message: "پیام همیاری",
  cooperation_complete: "تکمیل همکاری",
  appeal_decision: "نتیجه اعتراض",
  budget_proposal_reviewed: "نتیجه بررسی پیشنهاد بودجه",
  benefit_report_resolved: "نتیجه گزارش مزیت",
};

export const NOTIFICATION_TARGET_LABELS: Record<NotificationTargetType, string> = {
  problem: "مسئله",
  answer: "پاسخ",
  experience: "تجربه",
  circle: "حلقه",
  cooperation: "همکاری",
  appeal: "اعتراض",
  budget_proposal: "پیشنهاد بودجه",
  benefit_provider: "ارائه‌دهنده مزیت",
};

export const NOTIFICATION_TYPES: NotificationType[] = [
  "problem_answer",
  "answer_mention",
  "solution_selected",
  "circle_join_accepted",
  "circle_invite",
  "circle_meeting",
  "cooperation_offer",
  "cooperation_message",
  "cooperation_complete",
  "appeal_decision",
  "budget_proposal_reviewed",
  "benefit_report_resolved",
];