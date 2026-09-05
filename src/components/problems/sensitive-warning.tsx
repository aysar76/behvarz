"use client";

import type { SensitiveMatch } from "@/lib/content-safety";

export interface SensitiveWarningProps {
  matches: SensitiveMatch[];
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
}

export function SensitiveWarning({
  matches,
  acknowledged,
  onAcknowledge,
}: SensitiveWarningProps) {
  if (matches.length === 0) return null;

  return (
    <div className="border-warning/40 bg-warning/5 text-warning space-y-2 rounded-lg border p-3">
      <p className="text-sm font-bold">هشدار محتوای حساس</p>
      <p className="text-sm leading-6">
        متن شما شبیه اطلاعات قابل شناسایی بیمار یا شخص است:
      </p>
      <ul className="list-inside list-disc text-sm">
        {matches.map((match) => (
          <li key={match.code}>{match.label}</li>
        ))}
      </ul>
      <p className="text-sm leading-6">
        در این خانه، ثبت اطلاعات هویتی یا مشخصات قابل شناسایی بیمار ممنوع است.
        لطفاً محتوا را ناشناس‌سازی کنید.
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => onAcknowledge(event.target.checked)}
          className="accent-brand-600 mt-1"
        />
        <span>
          تأیید می‌کنم محتوای من شامل مشخصات قابل شناسایی بیمار یا شخص نیست.
        </span>
      </label>
    </div>
  );
}
