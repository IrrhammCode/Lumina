import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getPasskeyStatus } from "@/lib/server/webauthn";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  const status = await getPasskeyStatus(session.sub);
  return jsonOk(status);
}