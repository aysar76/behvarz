"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
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
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      <div
        className="border-amber-200 bg-amber-50 shadow-sm flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm"
        role="alert"
      >
        <span aria-hidden="true" className="text-amber-600">
          <Icon name="alert" className="size-5" />
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Badge tone={ACCOUNT_STATUS_TONES[user.accountStatus as keyof typeof ACCOUNT_STATUS_TONES]}>
            {ACCOUNT_STATUS_LABELS[
              user.accountStatus as keyof typeof ACCOUNT_STATUS_LABELS
            ]}
          </Badge>
          <p className="text-amber-900">
            {message}
            {user.accountStatusReason
              ? ` (دلیل: ${user.accountStatusReason})`
              : ""}
          </p>
        </div>
        <Link
          href="/appeals"
          className="text-brand-700 hover:text-brand-800 text-sm font-semibold"
        >
          اعتراض به تصمیم
        </Link>
      </div>
    </div>
  );
}