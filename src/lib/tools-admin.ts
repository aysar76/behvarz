import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit";
import { generateToolSlug } from "@/lib/tools";
import type { ToolKind, ToolStatus } from "@/generated/prisma/client";

/**
 * ایجاد ابزار اجرایی (کارخانه محتوا) توسط مدیر. ابزارها دانش قابل استفاده‌اند،
 * نه ثبت رسمی؛ بدون ورود به قلمرو سیب.
 */
export async function createTool(
  input: {
    kind: ToolKind;
    title: string;
    summary: string;
    body: string;
    status?: ToolStatus;
    tags?: string[];
  },
  createdById: string,
  ip?: string | null,
): Promise<{ id: string; slug: string }> {
  const status = input.status ?? "draft";
  const tool = await prisma.tool.create({
    data: {
      slug: generateToolSlug(),
      kind: input.kind,
      title: input.title,
      summary: input.summary,
      body: input.body,
      status,
      tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
      createdById,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  await auditLog({
    actorId: createdById,
    action: "tools.create",
    entityType: "Tool",
    entityId: tool.id,
    details: { kind: input.kind, status },
    ip: ip ?? null,
  });

  return { id: tool.id, slug: tool.slug };
}

/**
 * به‌روزرسانی ابزار اجرایی توسط مدیر. انتشار با وضعیت `published` فعال می‌شود.
 * هر تغییر نسخه را افزایش می‌دهد و `reviewedAt` را به‌روز می‌کند.
 */
export async function updateTool(
  toolId: string,
  input: {
    kind?: ToolKind;
    title?: string;
    summary?: string;
    body?: string;
    status?: ToolStatus;
    tags?: string[];
  },
  actorId: string,
  ip?: string | null,
): Promise<void> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { id: true, status: true },
  });
  if (!tool) {
    throw new AppError("NOT_FOUND", "ابزار یافت نشد");
  }

  const data: Record<string, unknown> = { version: { increment: 1 } };
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.title !== undefined) data.title = input.title;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.body !== undefined) data.body = input.body;
  if (input.tags !== undefined)
    data.tags = input.tags.length > 0 ? input.tags : [];

  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === "published") {
      data.publishedAt = tool.status === "published" ? undefined : new Date();
    }
    if (input.status !== "published") {
      data.publishedAt = null;
    }
  }

  await prisma.tool.update({ where: { id: toolId }, data });

  await auditLog({
    actorId,
    action: "tools.update",
    entityType: "Tool",
    entityId: toolId,
    details: { from: tool.status, to: input.status ?? undefined },
    ip: ip ?? null,
  });
}

/**
 * تغییر وضعیت ابزار اجرایی (مدیریت).
 */
export async function changeToolStatus(
  toolId: string,
  status: ToolStatus,
  actorId: string,
  ip?: string | null,
): Promise<void> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { id: true, status: true },
  });
  if (!tool) {
    throw new AppError("NOT_FOUND", "ابزار یافت نشد");
  }

  await prisma.tool.update({
    where: { id: toolId },
    data: {
      status,
      publishedAt: status === "published" ? new Date() : null,
      reviewedAt: status === "published" ? new Date() : undefined,
      version: { increment: 1 },
    },
  });

  await auditLog({
    actorId,
    action: "tools.statusChange",
    entityType: "Tool",
    entityId: toolId,
    details: { from: tool.status, to: status },
    ip: ip ?? null,
  });
}