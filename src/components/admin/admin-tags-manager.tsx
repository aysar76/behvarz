"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface AdminTag {
  id: string;
  name: string;
  isActive: boolean;
  _count: { problems: number; experiences: number };
}

export function AdminTagsManager() {
  const { toast } = useToast();
  const [tags, setTags] = useState<AdminTag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/tags?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { tags: AdminTag[] };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "خطا در دریافت برچسب‌ها");
      }
      setTags(body.data?.tags ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [query]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      load().then(() => {
        if (!active) return;
      });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [load]);

  async function createTag() {
    const name = newName.trim();
    if (name.length < 2) {
      toast({ title: "نام برچسب باید حداقل ۲ کاراکتر باشد", tone: "danger" });
      return;
    }
    setBusyId("new");
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت", tone: "danger" });
        return;
      }
      toast({ title: "برچسب ثبت شد", tone: "success" });
      setNewName("");
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTag(tag: AdminTag) {
    setBusyId(tag.id);
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tag.isActive }),
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

  return (
    <div className="space-y-6">
      <section className="border-border bg-card shadow-card rounded-xl border p-5">
        <h2 className="text-foreground mb-4 text-lg font-bold">افزودن برچسب</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="text-muted-foreground mb-1 block text-xs">
              نام برچسب
            </label>
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="مثلاً: بهداشت دهان"
            />
          </div>
          <Button onClick={createTag} loading={busyId === "new"}>
            افزودن
          </Button>
        </div>
      </section>

      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          جست‌وجو
        </label>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی برچسب..."
        />
      </div>

      {error ? (
        <EmptyState title="خطا در بارگذاری" description={error} />
      ) : tags === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="border-border bg-muted/40 h-12 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState
          title="برچسبی یافت نشد"
          description="با معیارهای جست‌وجو برچسبی پیدا نشد."
        />
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <article
              key={tag.id}
              className="border-border bg-card shadow-card flex flex-wrap items-center gap-3 rounded-xl border p-4"
            >
              <h3 className="text-foreground flex-1 text-sm font-bold">
                {tag.name}
              </h3>
              <span className="text-muted-foreground text-xs">
                {tag._count.problems} مسئله • {tag._count.experiences} تجربه
              </span>
              <Badge tone={tag.isActive ? "success" : "neutral"}>
                {tag.isActive ? "فعال" : "غیرفعال"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                loading={busyId === tag.id}
                onClick={() => toggleTag(tag)}
              >
                {tag.isActive ? "غیرفعال‌کردن" : "فعال‌کردن"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}