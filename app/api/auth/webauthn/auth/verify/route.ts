import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";
import { verifyAuthentication, type WebAuthnPurpose } from "@/lib/server/webauthn";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

type Body = {
  response?: AuthenticationResponseJSON;
  challengeToken?: string;
  purpose?: WebAuthnPurpose;
};

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseJsonBody<Body>(request);
  if (!body?.response || !body.challengeToken) {
    return jsonError("Authentication response required");
  }

  const user = await getUserById(session.sub);
  if (!user) return jsonError("User not found", 404);

  const result = await verifyAuthentication(
    user,
    body.response,
    body.challengeToken,
    body.purpose
  );

  if (!result.ok) return jsonError(result.error, 401);

  return jsonOk({ verified: true, purpose: result.purpose });
}