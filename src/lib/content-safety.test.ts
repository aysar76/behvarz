import { describe, expect, it } from "vitest";
import {
  hasSensitiveContent,
  scanSensitiveContent,
} from "@/lib/content-safety";

describe("scanSensitiveContent", () => {
  it("detects a national id (10 digits)", () => {
    const matches = scanSensitiveContent("کد ملی ۱۲۳۴۵۶۷۸۹۰ ثبت شد");
    expect(matches.some((m) => m.code === "national_id")).toBe(true);
  });

  it("detects a phone number", () => {
    const matches = scanSensitiveContent("با 09123456789 تماس بگیرید");
    expect(matches.some((m) => m.code === "phone")).toBe(true);
  });

  it("detects patient-identifying terms", () => {
    const matches = scanSensitiveContent("شماره پرونده بیمار را چک کردم");
    expect(matches.some((m) => m.code === "patient_term")).toBe(true);
  });

  it("returns no matches for anonymized professional content", () => {
    const matches = scanSensitiveContent(
      "پوشش واکسیناسیون در روستای محل خدمت کاهش یافته است. اقدامات انجام‌شده نتیجه نداده است.",
    );
    expect(matches).toHaveLength(0);
    expect(hasSensitiveContent("متن ساده حرفه‌ای")).toBe(false);
  });

  it("aggregates matches across multiple fields without duplicates", () => {
    const matches = scanSensitiveContent(
      "شماره پرونده بیمار",
      "همراه با 09123456789",
    );
    const codes = matches.map((m) => m.code);
    expect(codes).toContain("patient_term");
    expect(codes).toContain("phone");
    expect(new Set(codes).size).toBe(codes.length);
  });
});
