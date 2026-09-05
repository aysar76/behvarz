import type { ExperienceStatus } from "@/generated/prisma/client";

export const EXPERIENCE_STATUSES: ExperienceStatus[] = [
  "user_generated",
  "under_review",
  "reviewed",
  "featured",
  "archived",
];

const ALLOWED_TRANSITIONS: Record<ExperienceStatus, ExperienceStatus[]> = {
  user_generated: ["under_review", "reviewed", "featured", "archived"],
  under_review: ["reviewed", "featured", "archived"],
  reviewed: ["under_review", "featured", "archived"],
  featured: ["reviewed", "archived"],
  archived: ["user_generated", "reviewed"],
};

export function canTransition(
  from: ExperienceStatus,
  to: ExperienceStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** هنگام انتشار پیش‌نویس، وضعیت پایه «تجربه شخصی» است (مگر در صف بررسی). */
export function initialPublishedStatus(needsReview: boolean): ExperienceStatus {
  return needsReview ? "under_review" : "user_generated";
}