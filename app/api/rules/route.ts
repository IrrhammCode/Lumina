import type { NextRequest } from "next/server";
import type { AllowanceRule } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { getUserData, upsertRule } from "@/lib/server/user-data";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ rules: user.rules });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<AllowanceRule>(request);
  if (!body?.memberId || !body.needType) {
    return jsonError("Invalid rule payload");
  }

  const rule: AllowanceRule = {
    ...body,
    id: body.id || `rule_${Date.now()}`,
    createdAt: body.createdAt || new Date().toISOString(),
  };

  const updated = await upsertRule(session.sub, rule);
  if (!updated) return jsonError("Failed to save rule", 500);

  return jsonOk({ rule });
}