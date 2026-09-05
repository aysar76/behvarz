import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { serializeTool, type ToolRow } from "@/lib/tools";
import {
  TOOL_KIND_EMOJIS,
  TOOL_KIND_LABELS,
  TOOL_STATUS_LABELS,
  TOOL_STATUS_TONES,
} from "@/lib/constants/tool";

export const metadata = {
  title: "مدیریت ابزارها",
};

export default async function AdminToolsPage() {
  const tools = await prisma.tool.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          membershipStatus: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-extrabold">
            مدیریت ابزارها
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            کارخانه محتوا: راهنما، چک‌لیست، بسته مداخله و اقلام محتوایی.
          </p>
        </div>
        <Link href="/admin/tools/new">
          <Button>ابزار جدید</Button>
        </Link>
      </header>

      {tools.length === 0 ? (
        <EmptyState
          title="ابزاری ثبت نشده است"
          description="با ساختن نخستین ابزار، کارخانه محتوا را راه‌اندازی کنید."
          action={
            <Link href="/admin/tools/new">
              <Button>ساخت ابزار جدید</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">ابزار</th>
                <th className="px-4 py-3 text-right font-medium">نوع</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium">نسخه</th>
                <th className="px-4 py-3 text-right font-medium">مالک</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tools.map((raw) => {
                const tool = serializeTool(raw as unknown as ToolRow);
                const tone = TOOL_STATUS_TONES[tool.status];
                return (
                  <tr key={tool.id} className="hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tools/${tool.id}`}
                        className="text-foreground hover:text-brand-700 font-semibold"
                      >
                        {TOOL_KIND_EMOJIS[tool.kind]} {tool.title}
                      </Link>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {TOOL_KIND_LABELS[tool.kind]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>
                        {TOOL_STATUS_LABELS[tool.status]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {tool.version}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {tool.createdBy?.displayName ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}