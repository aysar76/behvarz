import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getCommandCenterReport } from "@/lib/command-center";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "command-center:view");

    const report = await getCommandCenterReport();

    return jsonOk(report);
  } catch (error) {
    return jsonError(error);
  }
}