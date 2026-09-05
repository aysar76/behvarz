import type { ToolKind, ToolStatus } from "@/generated/prisma/client";

export const TOOL_KINDS: {
  value: ToolKind;
  label: string;
  emoji: string;
}[] = [
  { value: "guide", label: "راهنما", emoji: "📖" },
  { value: "checklist", label: "چک‌لیست", emoji: "✅" },
  { value: "intervention", label: "بسته مداخله", emoji: "🧰" },
  { value: "content_item", label: "اقلام محتوایی", emoji: "📄" },
];

export const TOOL_KIND_LABELS: Record<ToolKind, string> = Object.fromEntries(
  TOOL_KINDS.map((item) => [item.value, item.label]),
) as Record<ToolKind, string>;

export const TOOL_KIND_EMOJIS: Record<ToolKind, string> = Object.fromEntries(
  TOOL_KINDS.map((item) => [item.value, item.emoji]),
) as Record<ToolKind, string>;

export const TOOL_STATUSES: {
  value: ToolStatus;
  label: string;
}[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی‌شده",
};

export const TOOL_STATUS_TONES: Record<
  ToolStatus,
  "neutral" | "success" | "warning"
> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

export const MAX_TOOL_TITLE_LENGTH = 150;
export const MAX_TOOL_SUMMARY_LENGTH = 500;
export const MAX_TOOL_BODY_LENGTH = 20000;
export const MAX_TOOL_TAGS = 8;
export const MAX_TOOL_TAG_LENGTH = 40;