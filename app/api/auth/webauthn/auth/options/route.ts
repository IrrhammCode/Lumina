import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";
import { createAuthenticationOptions, type WebAuthnPurpose } from "@/lib/server/webauthn";

type Body = { purpose?: WebAuthnPurpose };

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseJsonBody<Body>(request);
  const purpose = body?.purpose ?? "default";

  const user = await getUserById(session.sub);
  if (!user) return jsonError("User not found", 404);

  const auth = await createAuthenticationOptions(user, purpose);
  if (!auth) return jsonError("No passkey enrolled", 404);

  return jsonOk({ options: auth.options, challengeToken: auth.challengeToken });
}