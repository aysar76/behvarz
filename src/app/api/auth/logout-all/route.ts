import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import {
  clearSessionCookie,
  getClientIp,
  revokeAllSessions,
} from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request.headers);

    await revokeAllSessions(user.id);
    await clearSessionCookie();

    await auditLog({
      actorId: user.id,
      action: "auth.logout_all",
      entityType: "User",
      entityId: user.id,
      ip,
    });

    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}
