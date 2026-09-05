import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const termCreateSchema = z.object({
  term: z.string().trim().min(2, "واژه باید حداقل ۲ کاراکتر باشد").max(100),
  description: z.string().trim().max(300).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:terms");

    const terms = await prisma.sensitiveTerm.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, displayName: true } },
      },
    });

    return jsonOk({ terms });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:terms");

    const input = validateInput(
      termCreateSchema,
      await readJsonBody<z.infer<typeof termCreateSchema>>(request),
    );

    const existing = await prisma.sensitiveTerm.findUnique({
      where: { term: input.term },
      select: { id: true },
    });
    if (existing) {
      throw new AppError("CONFLICT", "این واژه قبلاً ثبت شده است");
    }

    const term = await prisma.sensitiveTerm.create({
      data: {
        term: input.term,
        description: input.description ?? null,
        createdById: user.id,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "admin.sensitive-term.create",
      entityType: "SensitiveTerm",
      entityId: term.id,
      details: { term: term.term },
      ip,
    });

    return jsonOk({ term }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}