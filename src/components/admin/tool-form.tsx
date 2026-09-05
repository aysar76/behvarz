"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TOOL_KINDS, TOOL_STATUSES } from "@/lib/constants/tool";

interface ToolFormValues {
  kind: string;
  title: string;
  summary: string;
  body: string;
  status: string;
  tags: string;
}

const EMPTY: ToolFormValues = {
  kind: "guide",
  title: "",
  summary: "",
  body: "",
  status: "draft",
  tags: "",
};

export function ToolForm({
  initial,
  toolId,
}: {
  initial?: Partial<ToolFormValues>;
  toolId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<ToolFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ToolFormValues>(
    key: K,
    value: ToolFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const tags = values.tags
        .split("،")
        .map((item) => item.trim())
        .filter(Boolean);
      const res = await fetch(
        toolId ? `/api/admin/tools/${toolId}` : "/api/admin/tools",
        {
          method: toolId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: values.kind,
            title: values.title,
            summary: values.summary,
            body: values.body,
            status: values.status,
            tags,
          }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ذخیره ابزار");
        return;
      }
      toast({ title: "ابزار ذخیره شد", tone: "success" });
      router.push("/admin/tools");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tool-title"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            عنوان ابزار
          </label>
          <input
            id="tool-title"
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            maxLength={150}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            placeholder="مثلاً: چک‌لیست آمادگی خانه بهداشت"
          />
        </div>
        <div>
          <label
            htmlFor="tool-kind"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            نوع ابزار
          </label>
          <select
            id="tool-kind"
            value={values.kind}
            onChange={(event) => set("kind", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          >
            {TOOL_KINDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="tool-summary"
          className="text-foreground mb-1 block text-sm font-medium"
        >
          خلاصه
        </label>
        <textarea
          id="tool-summary"
          value={values.summary}
          onChange={(event) => set("summary", event.target.value)}
          rows={2}
          maxLength={500}
          className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          placeholder="یک پاراگراف کوتاه درباره کاربرد ابزار..."
        />
      </div>

      <div>
        <label
          htmlFor="tool-body"
          className="text-foreground mb-1 block text-sm font-medium"
        >
          محتوا
        </label>
        <textarea
          id="tool-body"
          value={values.body}
          onChange={(event) => set("body", event.target.value)}
          rows={10}
          maxLength={20000}
          className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          placeholder="راهنمای کامل، چک‌لیست، بسته مداخله یا محتوای آموزشی..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tool-status"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            وضعیت
          </label>
          <select
            id="tool-status"
            value={values.status}
            onChange={(event) => set("status", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          >
            {TOOL_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="tool-tags"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            برچسب‌ها (با «،» جدا کنید)
          </label>
          <input
            id="tool-tags"
            value={values.tags}
            onChange={(event) => set("tags", event.target.value)}
            maxLength={200}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            placeholder="واکسیناسیون، تجهیزات، برنامه‌ریزی"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/tools")}
          disabled={loading}
        >
          انصراف
        </Button>
        <Button onClick={() => void handleSubmit()} loading={loading}>
          ذخیره ابزار
        </Button>
      </div>
    </div>
  );
}