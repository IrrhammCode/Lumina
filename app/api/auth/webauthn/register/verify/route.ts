import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";
import { verifyRegistration } from "@/lib/server/webauthn";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

type Body = {
  response?: RegistrationResponseJSON;
  challengeToken?: string;
  deviceName?: string;
};

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseJsonBody<Body>(request);
  if (!body?.response || !body.challengeToken) {
    return jsonError("Registration response required");
  }

  const user = await getUserById(session.sub);
  if (!user) return jsonError("User not found", 404);

  const result = await verifyRegistration(
    user,
    body.response,
    body.challengeToken,
    body.deviceName
  );

  if (!result.ok) return jsonError(result.error, 401);

  return jsonOk({
    enrolled: true,
    deviceName: result.credential.deviceName,
  });
}