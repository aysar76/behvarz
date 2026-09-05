import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { generateShortToken } from "@/lib/slug";
import type { ToolKind, ToolStatus } from "@/generated/prisma/client";

export const TOOL_LIST_INCLUDE = {
  createdBy: {
    select: { id: true, displayName: true, membershipStatus: true, role: true },
  },
} as const;

export interface ToolRow {
  id: string;
  slug: string;
  kind: ToolKind;
  title: string;
  summary: string;
  body: string;
  status: ToolStatus;
  version: number;
  reviewedAt: Date | null;
  tags: unknown;
  createdById: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    displayName: string | null;
    membershipStatus: string;
    role: string;
  } | null;
}

export interface SerializedTool {
  id: string;
  slug: string;
  kind: ToolKind;
  title: string;
  summary: string;
  body: string;
  status: ToolStatus;
  version: number;
  reviewedAt: string | null;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; displayName: string | null } | null;
}

export function serializeTool(tool: ToolRow): SerializedTool {
  const tags = Array.isArray(tool.tags)
    ? tool.tags.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  return {
    id: tool.id,
    slug: tool.slug,
    kind: tool.kind,
    title: tool.title,
    summary: tool.summary,
    body: tool.body,
    status: tool.status,
    version: tool.version,
    reviewedAt: tool.reviewedAt?.toISOString() ?? null,
    tags,
    publishedAt: tool.publishedAt?.toISOString() ?? null,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
    createdBy: tool.createdBy
      ? {
          id: tool.createdBy.id,
          displayName: tool.createdBy.displayName,
        }
      : null,
  };
}

export function generateToolSlug(): string {
  return `abzar-${generateShortToken()}`;
}

/**
 * فهرست ابزارهای اجرایی منتشرشده (کارخانه محتوا).
 * فقط ابزارهای `published` با `publishedAt` — بدون پیش‌نویس/بایگانی‌شده.
 */
export async function listPublishedTools(): Promise<SerializedTool[]> {
  const tools = await prisma.tool.findMany({
    where: { status: "published", publishedAt: { not: null } },
    include: TOOL_LIST_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });

  return (tools as unknown as ToolRow[]).map((tool) => serializeTool(tool));
}

/**
 * جزئیات یک ابزار منتشرشده بر اساس اسلاگ قابل اشتراک.
 */
export async function getPublishedToolBySlug(
  slug: string,
): Promise<SerializedTool> {
  const tool = await prisma.tool.findUnique({
    where: { slug },
    include: TOOL_LIST_INCLUDE,
  });

  if (!tool || tool.status !== "published" || !tool.publishedAt) {
    throw new AppError("NOT_FOUND", "ابزار یافت نشد");
  }

  return serializeTool(tool as unknown as ToolRow);
}