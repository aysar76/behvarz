import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "membership:review");

    const requests = await prisma.membershipRequest.findMany({
      where: { status: "pending" },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            displayName: true,
            province: true,
            city: true,
            workYears: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return jsonOk({ requests });
  } catch (error) {
    return jsonError(error);
  }
}
