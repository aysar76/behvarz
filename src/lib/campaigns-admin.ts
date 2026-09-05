import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit";
import type { CampaignFamily, CampaignStatus } from "@/generated/prisma/client";

/**
 * ایجاد کمپین/بازی شبکه‌ای توسط مدیر. کمپین سبک و اختیاری است؛ بدون لیدربورد.
 */
export async function createCampaign(
  input: {
    family: CampaignFamily;
    title: string;
    description: string;
    status?: CampaignStatus;
    startsAt?: string | null;
    endsAt?: string | null;
    isOptional?: boolean;
  },
  createdById: string,
  ip?: string | null,
): Promise<{ id: string }> {
  const status = input.status ?? "draft";
  const campaign = await prisma.campaign.create({
    data: {
      family: input.family,
      title: input.title,
      description: input.description,
      status,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      isOptional: input.isOptional ?? true,
      createdById,
      publishedAt: status === "active" ? new Date() : null,
    },
  });

  await auditLog({
    actorId: createdById,
    action: "campaigns.create",
    entityType: "Campaign",
    entityId: campaign.id,
    details: { family: input.family, status },
    ip: ip ?? null,
  });

  return { id: campaign.id };
}

/**
 * به‌روزرسانی کمپین توسط مدیر. انتشار با وضعیت `active` فعال می‌شود.
 */
export async function updateCampaign(
  campaignId: string,
  input: {
    family?: CampaignFamily;
    title?: string;
    description?: string;
    status?: CampaignStatus;
    startsAt?: string | null;
    endsAt?: string | null;
    isOptional?: boolean;
  },
  actorId: string,
  ip?: string | null,
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });
  if (!campaign) {
    throw new AppError("NOT_FOUND", "کمپین یافت نشد");
  }

  const data: Record<string, unknown> = {};
  if (input.family !== undefined) data.family = input.family;
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.startsAt !== undefined)
    data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.endsAt !== undefined)
    data.endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (input.isOptional !== undefined) data.isOptional = input.isOptional;

  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === "active") {
      data.publishedAt = campaign.status === "active" ? undefined : new Date();
    }
    if (input.status !== "active") {
      data.publishedAt = null;
    }
  }

  await prisma.campaign.update({ where: { id: campaignId }, data });

  await auditLog({
    actorId,
    action: "campaigns.update",
    entityType: "Campaign",
    entityId: campaignId,
    details: { from: campaign.status, to: input.status ?? undefined },
    ip: ip ?? null,
  });
}

/**
 * تغییر وضعیت کمپین (مدیریت) با تنظیم publishedAt.
 */
export async function changeCampaignStatus(
  campaignId: string,
  status: CampaignStatus,
  actorId: string,
  ip?: string | null,
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });
  if (!campaign) {
    throw new AppError("NOT_FOUND", "کمپین یافت نشد");
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status,
      publishedAt: status === "active" ? new Date() : null,
    },
  });

  await auditLog({
    actorId,
    action: "campaigns.statusChange",
    entityType: "Campaign",
    entityId: campaignId,
    details: { from: campaign.status, to: status },
    ip: ip ?? null,
  });
}