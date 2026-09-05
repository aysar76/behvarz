import { describe, expect, it } from "vitest";
import {
  formatJalali,
  formatJalaliLong,
  formatRelativeTime,
  toJalali,
  toPersianDigits,
} from "@/lib/dates";

describe("toJalali", () => {
  it("converts Nowruz (2021-03-21) to 1400/01/01", () => {
    expect(toJalali(new Date(2021, 2, 21))).toEqual({
      jy: 1400,
      jm: 1,
      jd: 1,
    });
  });

  it("converts 2022-01-01 to 1400/10/11", () => {
    expect(toJalali(new Date(2022, 0, 1))).toEqual({
      jy: 1400,
      jm: 10,
      jd: 11,
    });
  });
});

describe("formatJalali", () => {
  it("formats as YYYY/MM/DD with Persian digits", () => {
    expect(formatJalali(new Date(2021, 2, 21))).toBe("۱۴۰۰/۰۱/۰۱");
  });

  it("accepts an ISO string", () => {
    expect(formatJalali("2021-03-21T10:00:00.000Z")).toBe("۱۴۰۰/۰۱/۰۱");
  });
});

describe("formatJalaliLong", () => {
  it("formats a long Persian date", () => {
    expect(formatJalaliLong(new Date(2021, 2, 21))).toBe("۱ فروردین ۱۴۰۰");
  });
});

describe("toPersianDigits", () => {
  it("converts western digits to Persian digits", () => {
    expect(toPersianDigits("1400/01/01")).toBe("۱۴۰۰/۰۱/۰۱");
    expect(toPersianDigits(1234)).toBe("۱۲۳۴");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'همین حالا' for a very recent date", () => {
    expect(formatRelativeTime(new Date(Date.now() - 5_000))).toBe("همین حالا");
  });

  it("returns minutes for recent activity", () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60_000))).toBe(
      "۵ دقیقه پیش",
    );
  });

  it("falls back to a Jalali date for old dates", () => {
    expect(formatRelativeTime(new Date(2021, 2, 21))).toBe("۱۴۰۰/۰۱/۰۱");
  });
});
