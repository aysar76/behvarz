import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPublishedTools, type SerializedTool } from "@/lib/tools";
import { TOOL_KIND_LABELS } from "@/lib/constants/tool";
import { formatRelativeTime } from "@/lib/dates";

export const metadata = {
  title: "ابزارهای اجرایی",
};

const toolKindIcon: Record<SerializedTool["kind"], IconName> = {
  guide: "book",
  checklist: "check-circle",
  intervention: "wrench",
  content_item: "file-text",
};

const toolKindTone: Record<SerializedTool["kind"], string> = {
  guide: "from-brand-50 to-brand-100/70 border-brand-100 text-brand-700",
  checklist: "from-green-50 to-green-100/70 border-green-100 text-green-700",
  intervention: "from-sky-50 to-sky-100/70 border-sky-100 text-sky-700",
  content_item: "from-amber-50 to-amber-100/70 border-amber-100 text-amber-700",
};

function ToolCard({ tool }: { tool: SerializedTool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 group block rounded-2xl border p-4 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={`bg-gradient-to-br flex size-11 shrink-0 items-center justify-center rounded-xl border ${toolKindTone[tool.kind]}`}
        >
          <Icon name={toolKindIcon[tool.kind]} className="size-5" />
        </span>
        <Badge tone="neutral">{TOOL_KIND_LABELS[tool.kind]}</Badge>
      </div>
      <h3 className="text-foreground group-hover:text-brand-700 mt-3 font-bold transition-colors">
        {tool.title}
      </h3>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        {tool.summary}
      </p>
      {tool.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
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
        <PageHeader
          title="ابزارهای اجرایی"
          description="راهنماها، چک‌لیست‌ها، بسته‌های مداخله و اقلام محتوایی کاربردی برای کار میدانی — دانش قابل استفاده، بدون ورود به قلمرو سامانه رسمی."
          icon="wrench"
        />

        {tools.length === 0 ? (
          <EmptyState
            icon={<Icon name="wrench" className="size-6" />}
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