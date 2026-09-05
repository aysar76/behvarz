import { prisma } from "@/lib/db";
import { ToolForm } from "@/components/admin/tool-form";
import { Badge } from "@/components/ui/badge";
import { TOOL_STATUS_LABELS, TOOL_STATUS_TONES } from "@/lib/constants/tool";

export const metadata = {
  title: "ویرایش ابزار",
};

export default async function AdminToolEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await prisma.tool.findUnique({ where: { id } });

  if (!tool) {
    return <p className="text-muted-foreground text-sm">ابزار یافت نشد.</p>;
  }

  const tone = TOOL_STATUS_TONES[tool.status];
  const tags = Array.isArray(tool.tags)
    ? (tool.tags as string[]).join("، ")
    : "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          ویرایش ابزار
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <Badge tone={tone}>{TOOL_STATUS_LABELS[tool.status]}</Badge>
          <span className="text-muted-foreground">نسخه {tool.version}</span>
        </div>
      </header>
      <ToolForm
        toolId={tool.id}
        initial={{
          kind: tool.kind,
          title: tool.title,
          summary: tool.summary,
          body: tool.body,
          status: tool.status,
          tags,
        }}
      />
    </div>
  );
}