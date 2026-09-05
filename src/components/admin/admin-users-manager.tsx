"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
} from "@/lib/constants/moderation";
import { ROLE_LABELS } from "@/lib/rbac";

interface ModerationUser {
  id: string;
  displayName: string | null;
  phone: string;
  role: string;
  membershipStatus: string;
  accountStatus: string;
  accountStatusReason: string | null;
  accountStatusAt: string | null;
  province: string | null;
  city: string | null;
  createdAt: string;
  problemCount: number;
  experienceCount: number;
  reportCount: number;
}

const USER_STATUS_FILTERS = [
  { value: "", label: "همه" },
  { value: "active", label: "فعال" },
  { value: "warned", label: "اخطار" },
  { value: "restricted", label: "محدود" },
  { value: "suspended", label: "معلق" },
];

export function AdminUsersManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ModerationUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async (): Promise<ModerationUser[]> => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/users?${params.toString()}`, {
      cache: "no-store",
    });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { users: ModerationUser[] };
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error?.message ?? "خطا در دریافت کاربران");
    }
    return body.data?.users ?? [];
  }, [query, status]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [fetchUsers]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      fetchUsers()
        .then((items) => {
          if (active) setUsers(items);
        })
        .catch((err) => {
          if (active) {
            setError(
              err instanceof Error ? err.message : "خطا در ارتباط با سرور",
            );
          }
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchUsers]);

  async function applyAction(
    id: string,
    action: "warn" | "restrict" | "suspend" | "lift",
  ) {
    const reasonText = (reason[id] ?? "").trim();
    if (action !== "lift" && reasonText.length < 3) {
      toast({ title: "دلیل را وارد کنید (حداقل ۳ کاراکتر)", tone: "danger" });
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasonText }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در اقدام", tone: "danger" });
        return;
      }
      toast({ title: "اقدام ثبت شد", tone: "success" });
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label className="text-muted-foreground mb-1 block text-xs">
            جست‌وجو (نام/شماره/استان)
          </label>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی کاربر..."
          />
        </div>
        <div className="w-40">
          <label className="text-muted-foreground mb-1 block text-xs">
            وضعیت حساب
          </label>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {USER_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <EmptyState title="خطا در بارگذاری" description={error} />
      ) : users === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="border-border bg-muted/40 h-32 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="کاربری یافت نشد"
          description="با معیارهای جست‌وجو کاربری پیدا نشد."
        />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="border-border bg-card shadow-card rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-bold">
                  {user.displayName ?? "بی‌نام"}
                </h3>
                <Badge tone="neutral">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</Badge>
                <Badge
                  tone={
                    ACCOUNT_STATUS_TONES[
                      user.accountStatus as keyof typeof ACCOUNT_STATUS_TONES
                    ] ?? "neutral"
                  }
                >
                  {ACCOUNT_STATUS_LABELS[
                    user.accountStatus as keyof typeof ACCOUNT_STATUS_LABELS
                  ] ?? user.accountStatus}
                </Badge>
                {user.membershipStatus === "verified" && (
                  <Badge tone="success">عضو تأییدشده</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs" dir="ltr">
                {user.phone}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {[user.province, user.city].filter(Boolean).join("، ") ||
                  "محل خدمت ثبت نشده"}
                {" • "}
                عضویت: {formatRelativeTime(user.createdAt)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {user.problemCount} مسئله • {user.experienceCount} تجربه •{" "}
                {user.reportCount} گزارش دریافتی
              </p>
              {user.accountStatusReason && (
                <p className="bg-accent text-accent-foreground mt-2 rounded-md px-3 py-2 text-xs">
                  دلیل وضعیت: {user.accountStatusReason}
                </p>
              )}

              {user.accountStatus !== "active" ? (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === user.id}
                    onClick={() => applyAction(user.id, "lift")}
                  >
                    رفع محدودیت
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <Input
                    value={reason[user.id] ?? ""}
                    onChange={(event) =>
                      setReason((prev) => ({
                        ...prev,
                        [user.id]: event.target.value,
                      }))
                    }
                    placeholder="دلیل اقدام..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === user.id}
                      onClick={() => applyAction(user.id, "warn")}
                    >
                      اخطار
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === user.id}
                      onClick={() => applyAction(user.id, "restrict")}
                    >
                      محدودسازی
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      loading={busyId === user.id}
                      onClick={() => applyAction(user.id, "suspend")}
                    >
                      تعلیق
                    </Button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}