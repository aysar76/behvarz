import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { benefitProviderCreateSchema } from "@/lib/validations/benefits";
import {
  serializeBenefitProvider,
  type BenefitProviderRow,
} from "@/lib/benefits";
import type { z } from "zod";

type CreateInput = z.infer<typeof benefitProviderCreateSchema>;

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");

    const providers = await prisma.benefitProvider.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            membershipStatus: true,
            role: true,
          },
        },
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      providers: (providers as unknown as BenefitProviderRow[]).map((provider) =>
        serializeBenefitProvider(provider),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");

    const input = validateInput(
      benefitProviderCreateSchema,
      await readJsonBody<CreateInput>(request),
    );

    const status = input.status ?? "draft";
    const provider = await prisma.benefitProvider.create({
      data: {
        name: input.name,
        category: input.category,
        description: input.description,
        terms: input.terms,
        website: input.website ?? null,
        contactNote: input.contactNote ?? null,
        logoEmoji: input.logoEmoji ?? null,
        isSponsored: input.isSponsored ?? false,
        status,
        createdById: user.id,
        publishedAt: status === "approved" ? new Date() : null,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "benefits.providerCreate",
      entityType: "BenefitProvider",
      entityId: provider.id,
      details: { status },
      ip,
    });

    return jsonOk({ provider: { id: provider.id } }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}