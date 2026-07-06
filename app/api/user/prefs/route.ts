import type { NextRequest } from "next/server";
import { DEFAULT_PREFS } from "@/lib/prefs";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { getUserData, setPrefs } from "@/lib/server/user-data";
import type { LuminaPrefs } from "@/lib/prefs";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ prefs: user.prefs });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<Partial<LuminaPrefs>>(request);
  if (!body) return jsonError("Invalid body");

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const prefs = { ...DEFAULT_PREFS, ...user.prefs, ...body };
  const updated = await setPrefs(session.sub, prefs);
  if (!updated) return jsonError("Update failed", 500);

  return jsonOk({ prefs: updated.prefs });
}