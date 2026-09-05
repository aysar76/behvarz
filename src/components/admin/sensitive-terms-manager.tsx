"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";

interface SensitiveTermItem {
  id: string;
  term: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { id: string; displayName: string | null } | null;
}

export function SensitiveTermsManager() {
  const { toast } = useToast();
  const [terms, setTerms] = useState<SensitiveTermItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchTerms = useCallback(async (): Promise<SensitiveTermItem[]> => {
    const res = await fetch("/api/admin/sensitive-terms", { cache: "no-store" });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { terms: SensitiveTermItem[] };
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error?.message ?? "خطا در دریافت واژه‌ها");
    }
    return body.data?.terms ?? [];
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTerms(await fetchTerms());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [fetchTerms]);

  useEffect(() => {
    let active = true;
    fetchTerms()
      .then((items) => {
        if (active) setTerms(items);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "خطا در ارتباط با سرور",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [fetchTerms]);

  async function createTerm() {
    const term = newTerm.trim();
    if (term.length < 2) {
      toast({ title: "واژه باید حداقل ۲ کاراکتر باشد", tone: "danger" });
      return;
    }
    setBusyId("new");
    try {
      const res = await fetch("/api/admin/sensitive-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, description: newDescription.trim() || undefined }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت", tone: "danger" });
        return;
      }
      toast({ title: "واژه ثبت شد", tone: "success" });
      setNewTerm("");
      setNewDescription("");
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTerm(item: SensitiveTermItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/sensitive-terms/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در به‌روزرسانی", tone: "danger" });
        return;
      }
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTerm(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/sensitive-terms/${id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در حذف", tone: "danger" });
        return;
      }
      toast({ title: "واژه حذف شد", tone: "success" });
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border-border bg-card shadow-card rounded-xl border p-5">
        <h2 className="text-foreground mb-1 text-lg font-bold">افزودن واژه</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          واژه‌های فعال هنگام ثبت مسئله، تجربه، پاسخ و سایر محتوا بررسی می‌شوند
          و در صورت تطبیق، محتوا به صف بررسی ناظر می‌رود.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="text-muted-foreground mb-1 block text-xs">
              واژه/الگو
            </label>
            <Input
              value={newTerm}
              onChange={(event) => setNewTerm(event.target.value)}
              placeholder="مثلاً: کد ملی"
            />
          </div>
          <div className="min-w-52 flex-1">
            <label className="text-muted-foreground mb-1 block text-xs">
              توضیح (اختیاری)
            </label>
            <Input
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="چرا این واژه حساس است؟"
            />
          </div>
          <Button onClick={createTerm} loading={busyId === "new"}>
            افزودن
          </Button>
        </div>
      </section>

      {error ? (
        <EmptyState title="خطا در بارگذاری" description={error} />
      ) : terms === null ? (
        <div className="space-y-3">
          {[0, 1].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="border-border bg-muted/40 h-16 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      ) : terms.length === 0 ? (
        <EmptyState
          title="واژه‌ای ثبت نشده است"
          description="واژه‌های حساس قابل مدیریت را از اینجا اضافه کنید."
        />
      ) : (
        <div className="space-y-3">
          {terms.map((item) => (
            <article
              key={item.id}
              className="border-border bg-card shadow-card rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-bold" dir="ltr">
                  {item.term}
                </h3>
                <Badge tone={item.isActive ? "success" : "neutral"}>
                  {item.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  ثبت توسط {item.createdBy?.displayName ?? "سیستم"} •{" "}
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
              {item.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.description}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={busyId === item.id}
                  onClick={() => toggleTerm(item)}
                >
                  {item.isActive ? "غیرفعال‌کردن" : "فعال‌کردن"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === item.id}
                  onClick={() => deleteTerm(item.id)}
                >
                  حذف
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}