import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";

let prisma: PrismaClient;
let dbDir: string;

async function setupDatabase() {
  dbDir = mkdtempSync(join(tmpdir(), "behvarz-itest14-"));
  const dbPath = join(dbDir, "itest.db");
  const dbUrl = `file:${dbPath}`;
  process.env.DATABASE_URL = dbUrl;
  execSync(`pnpm prisma db push --url "file:${dbPath}"`, {
    stdio: "pipe",
    cwd: process.cwd(),
  });
  return dbPath;
}

beforeAll(async () => {
  const dbPath = await setupDatabase();
  process.env.DATABASE_URL = `file:${dbPath}`;
  const dbModule = await import("@/lib/db");
  prisma = dbModule.prisma;
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  if (dbDir) {
    try {
      rmSync(dbDir, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 200,
      });
    } catch {
      // best-effort cleanup on Windows
    }
  }
});

describe("phase-14 ecosystem against a real SQLite database", () => {
  it("joins/leaves a published active campaign only", async () => {
    const { joinCampaign, leaveCampaign, listCampaigns } = await import(
      "@/lib/campaigns"
    );

    const member = await prisma.user.create({
      data: { phone: "09120000011", displayName: "عضو کمپین" },
    });

    const active = await prisma.campaign.create({
      data: {
        family: "mission",
        title: "مأموریت فعال",
        description: "کمپین فعال برای آزمایش",
        status: "active",
        publishedAt: new Date(),
        createdById: member.id,
      },
    });

    const draft = await prisma.campaign.create({
      data: {
        family: "learning",
        title: "مأموریت پیش‌نویس",
        description: "کمپین پیش‌نویس برای آزمایش",
        status: "draft",
        createdById: member.id,
      },
    });

    await joinCampaign(active.id, member.id);
    await expect(joinCampaign(draft.id, member.id)).rejects.toThrow();

    let campaigns = await listCampaigns(member.id);
    expect(campaigns.map((c) => c.id)).toContain(active.id);
    expect(campaigns.map((c) => c.id)).not.toContain(draft.id);
    expect(campaigns.find((c) => c.id === active.id)?.isParticipating).toBe(true);

    await leaveCampaign(active.id, member.id);
    campaigns = await listCampaigns(member.id);
    expect(campaigns.find((c) => c.id === active.id)?.isParticipating).toBe(false);
  });

  it("publishes tools visible to members, hides drafts", async () => {
    const { listPublishedTools, getPublishedToolBySlug } = await import(
      "@/lib/tools"
    );

    const author = await prisma.user.create({
      data: { phone: "09120000012", displayName: "مدیر ابزار" },
    });

    const published = await prisma.tool.create({
      data: {
        slug: "abzar-itest-1",
        kind: "guide",
        title: "راهنمای آزمایش",
        summary: "خلاصه ابزار",
        body: "محتوا",
        status: "published",
        publishedAt: new Date(),
        reviewedAt: new Date(),
        createdById: author.id,
        tags: ["آزمایش"],
      },
    });

    await prisma.tool.create({
      data: {
        slug: "abzar-itest-2",
        kind: "checklist",
        title: "چک‌لیست پیش‌نویس",
        summary: "خلاصه",
        body: "محتوا",
        status: "draft",
        createdById: author.id,
      },
    });

    const tools = await listPublishedTools();
    expect(tools.map((t) => t.id)).toContain(published.id);
    expect(tools.some((t) => t.title === "چک‌لیست پیش‌نویس")).toBe(false);

    const detail = await getPublishedToolBySlug("abzar-itest-1");
    expect(detail.title).toBe("راهنمای آزمایش");
    await expect(getPublishedToolBySlug("abzar-itest-2")).rejects.toThrow();
  });

  it("aggregates anonymous barrier map only from consenting users", async () => {
    const { getBarrierMapReport, updateDataContribution } = await import(
      "@/lib/insights"
    );

    const consenting = await prisma.user.create({
      data: {
        phone: "09120000013",
        displayName: "مشارکت‌کننده",
        province: "تهران",
        allowDataContribution: true,
      },
    });

    const nonConsenting = await prisma.user.create({
      data: {
        phone: "09120000014",
        displayName: "بدون رضایت",
        province: "اصفهان",
        allowDataContribution: false,
      },
    });

    const createProblem = (authorId: string, barrierType: string) =>
      prisma.problem.create({
        data: {
          authorId,
          title: `مسئله ${barrierType}`,
          description: "شرح",
          barrierType: barrierType as "resources",
          isDraft: false,
          moderation: "visible",
          publishedAt: new Date(),
          status: "open",
        },
      });

    await createProblem(consenting.id, "resources");
    await createProblem(consenting.id, "equipment");
    await createProblem(nonConsenting.id, "resources");

    const report = await getBarrierMapReport();
    expect(report.contributors).toBe(1);
    expect(report.problemsContributed).toBe(2);
    const resources = report.totals.find((t) => t.barrierType === "resources");
    expect(resources?.count).toBe(1);
    const province = report.byProvince.find((p) => p.province === "تهران");
    expect(province?.total).toBe(2);

    await updateDataContribution(nonConsenting.id, true);
    const reportAfter = await getBarrierMapReport();
    expect(reportAfter.contributors).toBe(2);
    expect(reportAfter.problemsContributed).toBe(3);
  });

  it("computes command center overview and alerts", async () => {
    const { getCommandCenterReport } = await import("@/lib/command-center");

    const member = await prisma.user.create({
      data: { phone: "09120000015", displayName: "کاربر مرکز" },
    });

    await prisma.campaign.create({
      data: {
        family: "cooperation",
        title: "کمپین فعال",
        description: "برای گزارش مرکز",
        status: "active",
        publishedAt: new Date(),
        createdById: member.id,
      },
    });

    const report = await getCommandCenterReport();
    expect(report.overview.members).toBeGreaterThan(0);
    expect(report.overview.activeCampaigns).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
    expect(Array.isArray(report.trends)).toBe(true);
    expect(Array.isArray(report.patterns.barrierTypes)).toBe(true);
  });
});