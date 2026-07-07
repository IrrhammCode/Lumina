import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";
import { createRegistrationOptions } from "@/lib/server/webauthn";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  const user = await getUserById(session.sub);
  if (!user) return jsonError("User not found", 404);

  const { options, challengeToken } = await createRegistrationOptions(user);
  return jsonOk({ options, challengeToken });
}