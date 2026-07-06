import type { NextRequest } from "next/server";
import { isSession, jsonError, jsonOk, requireSession } from "@/lib/server/api-utils";
import { runAutopilotForUser } from "@/lib/server/autopilot";

/** Session-scoped sweep — runs due rules for the logged-in user (dev / on-open). */
export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const result = await runAutopilotForUser(session.sub);
  return jsonOk(result);
}