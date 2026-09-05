import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPublishedTools, type SerializedTool } from "@/lib/tools";
import { TOOL_KIND_EMOJIS, TOOL_KIND_LABELS } from "@/lib/constants/tool";
import { formatRelativeTime } from "@/lib/dates";

export const metadata = {
  title: "ابزارهای اجرایی",
};

function ToolCard({ tool }: { tool: SerializedTool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="border-border bg-card shadow-card hover:border-brand-300 group block rounded-xl border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-foreground text-2xl" aria-hidden="true">
          {TOOL_KIND_EMOJIS[tool.kind]}
        </span>
        <Badge tone="neutral">{TOOL_KIND_LABELS[tool.kind]}</Badge>
      </div>
      <h3 className="text-foreground group-hover:text-brand-700 mt-2 font-bold">
        {tool.title}
      </h3>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        {tool.summary}
      </p>
      {tool.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="text-muted-foreground mt-3 text-xs">
        انتشار: {formatRelativeTime(tool.publishedAt ?? tool.createdAt)}
      </div>
    </Link>
  );
}

export default async function ToolsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const tools = await listPublishedTools();

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            ابزارهای اجرایی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            راهنماها، چک‌لیست‌ها، بسته‌های مداخله و اقلام محتوایی کاربردی برای
            کار میدانی — دانش قابل استفاده، بدون ورود به قلمرو سامانه رسمی.
          </p>
        </header>

        {tools.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">🧰</span>}
            title="ابزاری منتشر نشده است"
            description="ابزارهای اجرایی آماده، به‌زودی اینجا در دسترس قرار می‌گیرند."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}