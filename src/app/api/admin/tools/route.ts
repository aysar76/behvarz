import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { toolCreateSchema } from "@/lib/validations/tool";
import { createTool } from "@/lib/tools-admin";
import { serializeTool, type ToolRow } from "@/lib/tools";
import { prisma } from "@/lib/db";
import type { z } from "zod";

type CreateInput = z.infer<typeof toolCreateSchema>;

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "tools:manage");

    const tools = await prisma.tool.findMany({
      include: {
        createdBy: {
          select: { id: true, displayName: true, membershipStatus: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      tools: (tools as unknown as ToolRow[]).map((tool) => serializeTool(tool)),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "tools:manage");

    const input = validateInput(
      toolCreateSchema,
      await readJsonBody<CreateInput>(request),
    );

    const tool = await createTool(input, user.id, ip);

    return jsonOk({ tool }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}