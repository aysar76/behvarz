import type {
  AccountStatus,
  ModerationAction,
  ModerationTargetType,
  User,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit";
import { TtlCache } from "@/lib/ttl-cache";
import {
  scanSensitiveContent,
  type SensitiveMatch,
} from "@/lib/content-safety";

const sensitiveTermCache = new TtlCache<string[]>({ ttlMs: 60_000 });

async function getActiveSensitiveTerms(): Promise<string[]> {
  const cached = sensitiveTermCache.get("active");
  if (cached) return cached;
  const terms = await prisma.sensitiveTerm.findMany({
    where: { isActive: true },
    select: { term: true },
  });
  const values = terms.map((item) => item.term);
  sensitiveTermCache.set("active", values);
  return values;
}

/** کاربری که حسابش معلق/محدود شده نمی‌تواند محتوای جدید منتشر کند. */
export function assertAccountCanCreate(user: User): void {
  if (user.accountStatus === "suspended") {
    throw new AppError(
      "FORBIDDEN",
      "حساب شما به دلیل نقض قواعد به حالت تعلیق درآمده است. برای اعتراض از مسیر «اعتراض به تصمیم» اقدام کنید.",
    );
  }
  if (user.accountStatus === "restricted") {
    throw new AppError(
      "FORBIDDEN",
      "حساب شما به‌طور موقت محدود شده و اجازه انتشار محتوای جدید را ندارد. برای اعتراض از مسیر «اعتراض به تصمیم» اقدام کنید.",
    );
  }
}

/** کاربر معلق نمی‌تواند تعامل (دنبال‌کردن، ذخیره، تشکر، گزارش) انجام دهد. */
export function assertAccountCanInteract(user: User): void {
  if (user.accountStatus === "suspended") {
    throw new AppError(
      "FORBIDDEN",
      "حساب شما به حالت تعلیق درآمده است و اجازه این اقدام را ندارد.",
    );
  }
}

/** ثبت تاریخچه تصمیم ناظر + Audit Log در یکجا. */
export async function recordModerationDecision(input: {
  moderatorId: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationAction;
  reason?: string;
  note?: string;
  ip?: string | null;
}): Promise<void> {
  await prisma.moderationDecision.create({
    data: {
      moderatorId: input.moderatorId,
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      reason: input.reason ?? null,
      note: input.note ?? null,
    },
  });

  await auditLog({
    actorId: input.moderatorId,
    action: `moderation.${input.action}`,
    entityType: `Moderation:${input.targetType}`,
    entityId: input.targetId,
    details: { reason: input.reason, note: input.note },
    ip: input.ip ?? null,
  });
}

/** اعتبارسنجی اینکه کاربر صاحب محتوای هدف برای اعتراض است. */
export async function assertAppealOwnership(input: {
  userId: string;
  targetType: "problem" | "answer" | "experience" | "account";
  targetId: string;
}): Promise<void> {
  if (input.targetType === "account") {
    if (input.targetId !== input.userId) {
      throw new AppError(
        "FORBIDDEN",
        "فقط می‌توانید به وضعیت حساب خودتان اعتراض کنید",
      );
    }
    return;
  }

  const own = (authorId: string | null | undefined): boolean =>
    authorId === input.userId;

  if (input.targetType === "problem") {
    const problem = await prisma.problem.findUnique({
      where: { id: input.targetId },
      select: { authorId: true },
    });
    if (!problem) throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    if (!own(problem.authorId)) {
      throw new AppError("FORBIDDEN", "فقط نویسنده می‌تواند اعتراض ثبت کند");
    }
    return;
  }

  if (input.targetType === "answer") {
    const answer = await prisma.problemAnswer.findUnique({
      where: { id: input.targetId },
      select: { authorId: true },
    });
    if (!answer) throw new AppError("NOT_FOUND", "پاسخ یافت نشد");
    if (!own(answer.authorId)) {
      throw new AppError("FORBIDDEN", "فقط نویسنده می‌تواند اعتراض ثبت کند");
    }
    return;
  }

  const experience = await prisma.experience.findUnique({
    where: { id: input.targetId },
    select: { authorId: true },
  });
  if (!experience) throw new AppError("NOT_FOUND", "تجربه یافت نشد");
  if (!own(experience.authorId)) {
    throw new AppError("FORBIDDEN", "فقط نویسنده می‌تواند اعتراض ثبت کند");
  }
}

/** جلوگیری از ثبت اعتراض تکراری (در انتظار بررسی). */
export async function assertNoPendingAppeal(input: {
  userId: string;
  targetType: "problem" | "answer" | "experience" | "account";
  targetId: string;
}): Promise<void> {
  const existing = await prisma.appeal.findFirst({
    where: {
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      status: "pending",
    },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(
      "CONFLICT",
      "شما قبلاً برای این مورد اعتراض ثبت کرده‌اید و در انتظار بررسی است",
    );
  }
}

export interface ModerationUserRow {
  id: string;
  displayName: string | null;
  phone: string;
  role: string;
  membershipStatus: string;
  accountStatus: AccountStatus;
  accountStatusReason: string | null;
  accountStatusAt: Date | null;
  province: string | null;
  city: string | null;
  createdAt: Date;
  _count?: {
    problems: number;
    experiences: number;
    problemReports: number;
  };
}

export interface SerializedModerationUser {
  id: string;
  displayName: string | null;
  phone: string;
  role: string;
  membershipStatus: string;
  accountStatus: AccountStatus;
  accountStatusReason: string | null;
  accountStatusAt: string | null;
  province: string | null;
  city: string | null;
  createdAt: string;
  problemCount: number;
  experienceCount: number;
  reportCount: number;
}

export function serializeModerationUser(
  user: ModerationUserRow,
): SerializedModerationUser {
  return {
    id: user.id,
    displayName: user.displayName,
    phone: user.phone,
    role: user.role,
    membershipStatus: user.membershipStatus,
    accountStatus: user.accountStatus,
    accountStatusReason: user.accountStatusReason,
    accountStatusAt: user.accountStatusAt?.toISOString() ?? null,
    province: user.province,
    city: user.city,
    createdAt: user.createdAt.toISOString(),
    problemCount: user._count?.problems ?? 0,
    experienceCount: user._count?.experiences ?? 0,
    reportCount: user._count?.problemReports ?? 0,
  };
}

export interface DecisionRow {
  id: string;
  moderatorId: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationAction;
  reason: string | null;
  note: string | null;
  createdAt: Date;
  moderator: { id: string; displayName: string | null };
}

export interface SerializedDecision {
  id: string;
  moderatorLabel: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationAction;
  reason: string | null;
  note: string | null;
  createdAt: string;
}

export function serializeDecision(decision: DecisionRow): SerializedDecision {
  return {
    id: decision.id,
    moderatorLabel: decision.moderator.displayName ?? "بی‌نام",
    targetType: decision.targetType,
    targetId: decision.targetId,
    action: decision.action,
    reason: decision.reason,
    note: decision.note,
    createdAt: decision.createdAt.toISOString(),
  };
}

/**
 * اسکن محتوا با ترکیب الگوهای ثابت (`content-safety.ts`) و واژه‌های حساس
 * فعال در دیتابیس (`SensitiveTerm`). نسخه async برای استفاده در مسیرهای API.
 */
export async function scanContentForModeration(
  ...texts: string[]
): Promise<SensitiveMatch[]> {
  const [staticMatches, activeTerms] = await Promise.all([
    Promise.resolve(scanSensitiveContent(...texts)),
    getActiveSensitiveTerms(),
  ]);

  const termMatches: SensitiveMatch[] = [];
  for (const term of activeTerms) {
    if (!term.trim()) continue;
    const found = texts.some((text) =>
      text?.toLowerCase().includes(term.toLowerCase()),
    );
    if (found) {
      termMatches.push({ code: "managed_term", label: `واژهٔ حساس: ${term}` });
    }
  }

  return [...staticMatches, ...termMatches];
}
