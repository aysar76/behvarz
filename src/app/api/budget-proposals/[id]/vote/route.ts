import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { assertAccountCanInteract } from "@/lib/moderation";
import { voteOnProposal } from "@/lib/benefits";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:propose");
    assertAccountCanInteract(user);
    const { id } = await params;

    const { count } = await voteOnProposal(id, user.id);

    return jsonOk({ voted: true, count });
  } catch (error) {
    return jsonError(error);
  }
}