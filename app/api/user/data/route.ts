import type { NextRequest } from "next/server";
import { isSession, jsonError, jsonOk, requireSession } from "@/lib/server/api-utils";
import { getSnapshot } from "@/lib/server/user-data";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const snapshot = await getSnapshot(session.sub);
  if (!snapshot) return jsonError("User not found", 404);

  return jsonOk(snapshot);
}