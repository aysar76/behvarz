import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/api";
import {
  clearSessionCookie,
  revokeSession,
  SESSION_COOKIE,
} from "@/lib/auth/session";

export async function POST() {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) {
      await revokeSession(token);
    }
    await clearSessionCookie();
    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}
