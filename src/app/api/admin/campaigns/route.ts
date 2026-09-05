import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { campaignCreateSchema } from "@/lib/validations/campaign";
import { createCampaign } from "@/lib/campaigns-admin";
import { serializeCampaign, type CampaignRow } from "@/lib/campaigns";
import { prisma } from "@/lib/db";
import type { z } from "zod";

type CreateInput = z.infer<typeof campaignCreateSchema>;

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "campaigns:manage");

    const campaigns = await prisma.campaign.findMany({
      include: {
        createdBy: {
          select: { id: true, displayName: true, membershipStatus: true, role: true },
        },
        _count: { select: { participations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      campaigns: (campaigns as unknown as CampaignRow[]).map((campaign) =>
        serializeCampaign(campaign),
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
    assertPermission(user, "campaigns:manage");

    const input = validateInput(
      campaignCreateSchema,
      await readJsonBody<CreateInput>(request),
    );

    const campaign = await createCampaign(input, user.id, ip);

    return jsonOk({ campaign }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}