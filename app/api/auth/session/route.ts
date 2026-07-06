import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return jsonError("No session", 401);
  }

  const user = await getUserById(session.sub);
  if (!user) {
    return jsonError("User not found", 404);
  }

  return jsonOk({
    user: {
      email: user.email,
      loggedIn: true,
      walletAddress: user.walletAddress,
      portalToken: user.portalToken,
      onboarded: user.onboarded,
    },
  });
}