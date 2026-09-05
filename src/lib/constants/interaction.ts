import type {
  FollowTargetType,
  SavedTargetType,
  ThanksTargetType,
} from "@/generated/prisma/client";

export const FOLLOW_TARGET_LABELS: Record<FollowTargetType, string> = {
  tag: "موضوع",
  problem: "مسئله",
  experience: "تجربه",
  user: "عضو",
};

export const SAVED_TARGET_LABELS: Record<SavedTargetType, string> = {
  problem: "مسئله",
  experience: "تجربه",
};

export const THANKS_TARGET_LABELS: Record<ThanksTargetType, string> = {
  answer: "پاسخ",
  experience: "تجربه",
};
