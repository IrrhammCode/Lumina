import type { NextRequest } from "next/server";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { getUserData, patchUserData } from "@/lib/server/user-data";

type Body = { pledgeRef?: string; signature?: string };

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<Body>(request);
  const pledgeRef = body?.pledgeRef?.trim();
  if (!pledgeRef || !pledgeRef.startsWith("magic:")) {
    return jsonError("Valid pledge reference is required");
  }

  const updated = await patchUserData(session.sub, { carePledgeRef: pledgeRef });
  if (!updated) return jsonError("User not found", 404);

  return jsonOk({ carePledgeRef: updated.carePledgeRef });
}

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ carePledgeRef: user.carePledgeRef ?? null });
}