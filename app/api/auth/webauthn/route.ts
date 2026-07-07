import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { removePasskeys } from "@/lib/server/webauthn";

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  await removePasskeys(session.sub);
  return jsonOk({ removed: true });
}