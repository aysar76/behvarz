import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CampaignFamily,
  CampaignStatus,
} from "@/generated/prisma/client";

export const CAMPAIGN_LIST_INCLUDE = {
  createdBy: {
    select: { id: true, displayName: true, membershipStatus: true, role: true },
  },
  _count: { select: { participations: true } },
} as const;

export interface CampaignRow {
  id: string;
  family: CampaignFamily;
  title: string;
  description: string;
  status: CampaignStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  isOptional: boolean;
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
  _count?: { participations: number };
  participations?: { userId: string }[];
}

export interface SerializedCampaign {
  id: string;
  family: CampaignFamily;
  title: string;
  description: string;
  status: CampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  isOptional: boolean;
  participationCount: number;
  isParticipating: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; displayName: string | null } | null;
}

export function serializeCampaign(
  campaign: CampaignRow,
  options: { isParticipating?: boolean } = {},
): SerializedCampaign {
  return {
    id: campaign.id,
    family: campaign.family,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    startsAt: campaign.startsAt?.toISOString() ?? null,
    endsAt: campaign.endsAt?.toISOString() ?? null,
    isOptional: campaign.isOptional,
    participationCount:
      campaign._count?.participations ?? campaign.participations?.length ?? 0,
    isParticipating: options.isParticipating ?? false,
    publishedAt: campaign.publishedAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    createdBy: campaign.createdBy
      ? {
          id: campaign.createdBy.id,
          displayName: campaign.createdBy.displayName,
        }
      : null,
  };
}

/**
 * فهرست کمپین‌های قابل نمایش (فعال/تکمیل‌شده و منتشرشده) به‌همراه
 * وضعیت مشارکت کاربر واردشده. کمپین‌ها سبک و اختیاری‌اند؛ بدون لیدربورد.
 */
export async function listCampaigns(
  userId: string,
): Promise<SerializedCampaign[]> {
  const [campaigns, participations] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        status: { in: ["active", "completed"] },
        publishedAt: { not: null },
      },
      include: {
        ...CAMPAIGN_LIST_INCLUDE,
        participations: {
          where: { userId },
          select: { userId: true },
          take: 1,
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.campaignParticipation.findMany({
      where: { userId },
      select: { campaignId: true },
    }),
  ]);

  const participationSet = new Set(
    participations.map((item) => item.campaignId),
  );

  return (campaigns as unknown as CampaignRow[]).map((campaign) =>
    serializeCampaign(campaign, {
      isParticipating: participationSet.has(campaign.id),
    }),
  );
}

/**
 * جزئیات یک کمپین قابل نمایش برای کاربر. فقط کمپین‌های منتشرشده (فعال/تکمیل) در دسترس.
 */
export async function getCampaign(
  campaignId: string,
  userId: string,
): Promise<SerializedCampaign> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      ...CAMPAIGN_LIST_INCLUDE,
      participations: {
        where: { userId },
        select: { userId: true },
        take: 1,
      },
    },
  });

  if (!campaign) {
    throw new AppError("NOT_FOUND", "کمپین یافت نشد");
  }

  const visible = campaign.publishedAt !== null && campaign.status !== "draft";
  if (!visible) {
    throw new AppError("NOT_FOUND", "کمپین یافت نشد");
  }

  return serializeCampaign(campaign as unknown as CampaignRow, {
    isParticipating: (campaign.participations?.length ?? 0) > 0,
  });
}

/**
 * مشارکت اختیاری در کمپین فعال/منتشرشده. هر کاربر فقط یک‌بار.
 */
export async function joinCampaign(
  campaignId: string,
  userId: string,
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, publishedAt: true, isOptional: true },
  });
  if (!campaign || campaign.status !== "active" || !campaign.publishedAt) {
    throw new AppError("NOT_FOUND", "کمپین فعال یافت نشد");
  }

  await prisma.campaignParticipation.upsert({
    where: { campaignId_userId: { campaignId, userId } },
    update: {},
    create: { campaignId, userId },
  });
}

/**
 * انصراف از مشارکت در کمپین.
 */
export async function leaveCampaign(
  campaignId: string,
  userId: string,
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!campaign || campaign.status !== "active" || !campaign.publishedAt) {
    throw new AppError("NOT_FOUND", "کمپین فعال یافت نشد");
  }

  await prisma.campaignParticipation.deleteMany({
    where: { campaignId, userId },
  });
}