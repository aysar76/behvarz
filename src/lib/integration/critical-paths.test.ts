import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";

let prisma: PrismaClient;
let dbDir: string;

async function setupDatabase() {
  dbDir = mkdtempSync(join(tmpdir(), "behvarz-itest-"));
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
      // temp dir cleanup is best-effort on Windows
    }
  }
});

describe("critical knowledge path against a real SQLite database", () => {
  it("searches published problems, experiences and members", async () => {
    const author = await prisma.user.create({
      data: {
        phone: "09120000001",
        displayName: "مریم بهورز",
        province: "تهران",
        city: "شهرری",
        onboardingCompleted: true,
        visibility: "members",
      },
    });

    await prisma.user.create({
      data: {
        phone: "09120000002",
        displayName: "علی مراقب",
        province: "اصفهان",
        city: null,
        onboardingCompleted: true,
        visibility: "public",
      },
    });

    const problem = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: "کمبود انسولین در خانه بهداشت",
        description: "چند ماه است انسولین به موقع نمی‌رسد",
        context: "منطقه محروم",
        barrierType: "equipment",
        urgency: "high",
        status: "open",
        isDraft: false,
        moderation: "visible",
        publishedAt: new Date(),
      },
    });

    const experience = await prisma.experience.create({
      data: {
        authorId: author.id,
        slug: "exper-ensulin-1",
        title: "تجربه تأمین انسولین از طریق بیمارستان",
        situation: "کمبود انسولین",
        conditions: "منطقه محروم",
        action: "هماهنگی با بیمارستان معین",
        result: "تأمین شد",
        status: "featured",
        isDraft: false,
        moderation: "visible",
        publishedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    const { searchAll } = await import("@/lib/search");
    const results = await searchAll({
      q: "انسولین",
      type: "all",
      limit: 10,
    });

    expect(results.problems.map((p) => p.id)).toContain(problem.id);
    expect(results.experiences.map((e) => e.id)).toContain(experience.id);
    expect(results.members).toEqual([]);

    const authorSearch = await searchAll({
      q: "مریم",
      type: "members",
      limit: 10,
    });
    expect(authorSearch.members.map((m) => m.id)).toContain(author.id);
  });

  it("excludes drafts, hidden and removed content from search", async () => {
    const author = await prisma.user.create({
      data: {
        phone: "09120000003",
        displayName: "دکتر ناشناس",
        onboardingCompleted: true,
        visibility: "public",
      },
    });

    const draft = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: "پیش‌نویس مخفی",
        description: "هنوز منتشر نشده",
        isDraft: true,
        moderation: "visible",
        publishedAt: null,
      },
    });

    const hidden = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: "مسئله پنهان",
        description: "پنهان شده",
        isDraft: false,
        moderation: "hidden",
        publishedAt: new Date(),
      },
    });

    const { searchAll } = await import("@/lib/search");
    const results = await searchAll({
      q: "مخفی",
      type: "problems",
      limit: 10,
    });
    expect(results.problems.map((p) => p.id)).not.toContain(draft.id);
    expect(results.problems.map((p) => p.id)).not.toContain(hidden.id);
  });

  it("returns interest-based discovery and unfinished drafts", async () => {
    const author = await prisma.user.create({
      data: {
        phone: "09120000004",
        displayName: "مربی",
        onboardingCompleted: true,
        visibility: "public",
      },
    });

    const interest = await prisma.interest.create({
      data: { name: "واکسیناسیون" },
    });
    await prisma.userInterest.create({
      data: { userId: author.id, interestId: interest.id },
    });

    const tag = await prisma.tag.create({ data: { name: "واکسیناسیون" } });

    const problem = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: "واکسیناسیون در مناطق سخت‌گذر",
        description: "چگونگی پوشش واکسیناسیون",
        isDraft: false,
        moderation: "visible",
        publishedAt: new Date(),
        status: "open",
        tags: { create: [{ tagId: tag.id }] },
      },
    });

    const draft = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: "پیش‌نویس من",
        description: "در حال ویرایش",
        isDraft: true,
        moderation: "visible",
      },
    });

    const secondUser = await prisma.user.create({
      data: {
        phone: "09120000005",
        displayName: "بیننده",
        onboardingCompleted: true,
        visibility: "public",
        interests: { create: [{ interestId: interest.id }] },
      },
    });

    await prisma.problem.create({
      data: {
        authorId: secondUser.id,
        title: "پیش‌نویس بیننده",
        description: "در حال ویرایش",
        isDraft: true,
        moderation: "visible",
      },
    });

    const { getDiscovery } = await import("@/lib/discovery");
    const discovery = await getDiscovery({ userId: secondUser.id, limit: 5 });

    expect(discovery.interestProblems.map((p) => p.id)).toContain(problem.id);
    expect(discovery.unfinished.some((u) => u.id === draft.id)).toBe(false);
    expect(
      discovery.unfinished.some((u) => u.title === "پیش‌نویس بیننده"),
    ).toBe(true);
  });

  it("round-trips problem and experience serialization with a real row", async () => {
    const author = await prisma.user.create({
      data: {
        phone: "09120000006",
        displayName: "بهورز",
        onboardingCompleted: true,
        visibility: "public",
      },
    });

    const problem = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: "مسئله سریالایز",
        description: "توضیح",
        isDraft: false,
        moderation: "visible",
        publishedAt: new Date(),
        status: "solved",
        conclusion: "جمع‌بندی",
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
            role: true,
          },
        },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                province: true,
                city: true,
                membershipStatus: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        _count: { select: { answers: true } },
      },
    });

    const { serializeProblem } = await import("@/lib/serializers/problem");
    const serialized = serializeProblem(problem as never, {
      currentUserId: author.id,
    });
    expect(serialized.id).toBe(problem.id);
    expect(serialized.status).toBe("solved");
    expect(serialized.conclusion).toBe("جمع‌بندی");
  });
});
