import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { serializeUser, type UserWithProfile } from "@/lib/serializers";
import { profileSchema } from "@/lib/validations/auth";
import type { z } from "zod";

type ProfileInput = z.infer<typeof profileSchema>;

async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });
}

async function syncSkills(userId: string, skillNames: string[]): Promise<void> {
  const skills = await Promise.all(
    skillNames.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  await prisma.userSkill.deleteMany({ where: { userId } });
  if (skills.length > 0) {
    await prisma.userSkill.createMany({
      data: skills.map((skill) => ({ userId, skillId: skill.id })),
    });
  }
}

async function syncInterests(
  userId: string,
  interestNames: string[],
): Promise<void> {
  const interests = await Promise.all(
    interestNames.map((name) =>
      prisma.interest.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  await prisma.userInterest.deleteMany({ where: { userId } });
  if (interests.length > 0) {
    await prisma.userInterest.createMany({
      data: interests.map((interest) => ({ userId, interestId: interest.id })),
    });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    if (!profile) {
      throw new AppError("NOT_FOUND", "کاربر یافت نشد");
    }
    return jsonOk({ user: serializeUser(profile) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    const input = validateInput(
      profileSchema,
      await readJsonBody<ProfileInput>(request),
    );

    await syncSkills(user.id, input.skills);
    await syncInterests(user.id, input.interests);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: input.displayName,
        province: input.province,
        city: input.city,
        workYears: input.workYears,
        bio: input.bio ?? null,
        visibility: input.visibility,
        onboardingCompleted: true,
      },
      include: {
        skills: { include: { skill: true } },
        interests: { include: { interest: true } },
      },
    });

    await auditLog({
      actorId: user.id,
      action: "profile.update",
      entityType: "User",
      entityId: user.id,
      ip,
    });

    return jsonOk({ user: serializeUser(updated as UserWithProfile) });
  } catch (error) {
    return jsonError(error);
  }
}
