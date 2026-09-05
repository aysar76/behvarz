import { describe, expect, it } from "vitest";
import { extractMentionNames } from "@/lib/mention";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/constants/notification";

describe("extractMentionNames", () => {
  it("extracts Persian and Latin mention names", () => {
    expect(extractMentionNames("سلام @مریم و @علی رضایی و دوباره @مریم")).toEqual([
      "مریم",
      "علی",
    ]);
  });

  it("deduplicates names", () => {
    expect(extractMentionNames("@احمد @احمد @حسن")).toEqual(["احمد", "حسن"]);
  });

  it("returns empty for text without mentions", () => {
    expect(extractMentionNames("بدون اشاره")).toEqual([]);
    expect(extractMentionNames("")).toEqual([]);
  });

  it("does not match email-like or mid-word at signs", () => {
    expect(extractMentionNames("متن @ali.com متن")).toEqual(["ali.com"]);
  });
});

describe("notification type labels", () => {
  it("covers all notification types", () => {
    expect(Object.keys(NOTIFICATION_TYPE_LABELS).length).toBe(10);
    expect(NOTIFICATION_TYPE_LABELS.problem_answer).toBe("پاسخ به مسئله");
    expect(NOTIFICATION_TYPE_LABELS.solution_selected).toBe(
      "انتخاب راهکار شما",
    );
  });
});
