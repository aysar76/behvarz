import type { ProblemStatus } from "@/generated/prisma/client";

const ALLOWED_TRANSITIONS: Record<ProblemStatus, ProblemStatus[]> = {
  open: ["discussing", "solved", "archived"],
  discussing: ["solved", "archived"],
  solved: ["archived"],
  archived: [],
};

export function canTransition(from: ProblemStatus, to: ProblemStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** وقتی اولین پاسخ ثبت می‌شود، مسئله از «باز» به «در حال بررسی» می‌رود. */
export function nextStatusAfterAnswer(status: ProblemStatus): ProblemStatus {
  return status === "open" ? "discussing" : status;
}
