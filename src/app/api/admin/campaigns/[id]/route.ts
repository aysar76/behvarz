import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { campaignUpdateSchema } from "@/lib/validations/campaign";
import { updateCampaign } from "@/lib/campaigns-admin";
import { prisma } from "@/lib/db";
import type { z } from "zod";

type UpdateInput = z.infer<typeof campaignUpdateSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "campaigns:manage");
    const { id } = await params;

    const current = await prisma.campaign.findUnique({ where: { id } });
    if (!current) {
      throw new AppError("NOT_FOUND", "کمپین یافت نشد");
    }

    const input = validateInput(
      campaignUpdateSchema,
      await readJsonBody<UpdateInput>(request),
    );

    await updateCampaign(id, input, user.id, ip);

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}