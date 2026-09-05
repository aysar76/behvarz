import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const tagCreateSchema = z.object({
  name: z.string().trim().min(2, "نام برچسب باید حداقل ۲ کاراکتر باشد").max(40),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    assertPermission(user, "tags:manage");

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    const tags = await prisma.tag.findMany({
      where: q ? { name: { contains: q } } : undefined,
      include: {
        _count: { select: { problems: true, experiences: true } },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    return jsonOk({ tags });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "tags:manage");

    const input = validateInput(
      tagCreateSchema,
      await readJsonBody<z.infer<typeof tagCreateSchema>>(request),
    );

    const existing = await prisma.tag.findUnique({ where: { name: input.name } });
    if (existing) {
      throw new AppError("CONFLICT", "این برچسب قبلاً ثبت شده است");
    }

    const tag = await prisma.tag.create({ data: { name: input.name } });

    await auditLog({
      actorId: user.id,
      action: "admin.tag.create",
      entityType: "Tag",
      entityId: tag.id,
      details: { name: tag.name },
      ip,
    });

    return jsonOk({ tag }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}