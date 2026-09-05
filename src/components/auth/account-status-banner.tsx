"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_MESSAGES,
  ACCOUNT_STATUS_TONES,
} from "@/lib/constants/moderation";

export function AccountStatusBanner() {
  const { user } = useSession();

  if (!user || user.accountStatus === "active") {
    return null;
  }

  const message =
    ACCOUNT_STATUS_MESSAGES[
      user.accountStatus as keyof typeof ACCOUNT_STATUS_MESSAGES
    ];

  return (
    <div className="border-border bg-card shadow-card mx-auto w-full max-w-5xl px-4 pt-4">
      <div
        className="border-border border bg-amber-50 px-4 py-3 text-sm rounded-lg"
        role="alert"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={ACCOUNT_STATUS_TONES[user.accountStatus as keyof typeof ACCOUNT_STATUS_TONES]}>
            {ACCOUNT_STATUS_LABELS[
              user.accountStatus as keyof typeof ACCOUNT_STATUS_LABELS
            ]}
          </Badge>
          <p className="text-amber-900 flex-1">
            {message}
            {user.accountStatusReason
              ? ` (دلیل: ${user.accountStatusReason})`
              : ""}
          </p>
          <Link
            href="/appeals"
            className="text-brand-700 hover:text-brand-800 text-sm font-medium underline"
          >
            اعتراض به تصمیم
          </Link>
        </div>
      </div>
    </div>
  );
}