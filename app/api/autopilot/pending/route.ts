import type { NextRequest } from "next/server";
import { isSession, jsonError, jsonOk, requireSession } from "@/lib/server/api-utils";
import { getPendingAutopilotPayments } from "@/lib/server/autopilot";
import { getUserData } from "@/lib/server/user-data";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const pending = getPendingAutopilotPayments(user);
  const rules = pending
    .map((p) => user.rules.find((r) => r.id === p.ruleId))
    .filter(Boolean);

  return jsonOk({ pending, rules });
}