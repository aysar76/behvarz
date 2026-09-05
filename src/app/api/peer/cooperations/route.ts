import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import {
  serializePeerCooperation,
  type PeerCooperationRow,
} from "@/lib/serializers/peer";

export async function GET() {
  try {
    const user = await requireUser();

    const rows = await prisma.peerCooperation.findMany({
      where: {
        OR: [{ requesterId: user.id }, { helperId: user.id }],
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
        },
        helper: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });

    return jsonOk({
      cooperations: (rows as unknown as PeerCooperationRow[]).map(
        serializePeerCooperation,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}