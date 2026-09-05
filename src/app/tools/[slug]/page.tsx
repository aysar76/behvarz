import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPublishedToolBySlug } from "@/lib/tools";
import { TOOL_KIND_EMOJIS, TOOL_KIND_LABELS } from "@/lib/constants/tool";
import { formatRelativeTime } from "@/lib/dates";

export const metadata = {
  title: "ابزار اجرایی",
};

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const { slug } = await params;
  const tool = await getPublishedToolBySlug(slug);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/tools"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← بازگشت به ابزارها
        </Link>

        <article className="border-border bg-card shadow-card rounded-xl border p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground text-2xl" aria-hidden="true">
              {TOOL_KIND_EMOJIS[tool.kind]}
            </span>
            <Badge tone="neutral">{TOOL_KIND_LABELS[tool.kind]}</Badge>
            <Badge tone="brand">نسخه {tool.version}</Badge>
          </div>

          <h1 className="text-foreground mt-3 text-2xl font-extrabold">
            {tool.title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            {tool.summary}
          </p>

          {tool.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tool.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="bg-muted/40 border-border mt-5 rounded-lg border p-4">
            <p className="text-foreground whitespace-pre-wrap text-sm leading-8">
              {tool.body}
            </p>
          </div>

          <footer className="text-muted-foreground mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              انتشار: {formatRelativeTime(tool.publishedAt ?? tool.createdAt)}
            </span>
            {tool.reviewedAt && (
              <span>بازبینی: {formatRelativeTime(tool.reviewedAt)}</span>
            )}
            <span>
              منبع: {tool.createdBy?.displayName ?? "تیم جامعه هم‌بهورز"}
            </span>
          </footer>
        </article>

        <section className="border-border bg-card shadow-card rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-bold">نکته مهم</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-6">
            این ابزار یک «منبع کمکی» برای کار میدانی است و هیچ جایگزینی برای
            دستورالعمل‌ها و سامانه رسمی (سیب) نیست. محتوای این صفحه برچسب «محتوای
            بررسی‌شده جامعه» را دارد، نه مدرک رسمی.
          </p>
        </section>
      </div>
    </AppShell>
  );
}