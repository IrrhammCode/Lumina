import type { NextRequest } from "next/server";
import type { NeedType } from "@/lib/allowances";
import type { RequestSource } from "@/lib/requests";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { addRequest, getUserData } from "@/lib/server/user-data";

type CreateBody = {
  memberId: string;
  needType: NeedType;
  title: string;
  message: string;
  amount: number;
  dueLabel: string;
  billNote: string;
  source: RequestSource;
};

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ requests: user.requests });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<CreateBody>(request);
  if (!body?.memberId || !body.needType || !body.title) {
    return jsonError("Invalid request payload");
  }

  const requestRecord = {
    id: `req_${Date.now()}`,
    memberId: body.memberId,
    needType: body.needType,
    title: body.title,
    message: body.message ?? "",
    amount: Number(body.amount) || 0,
    dueLabel: body.dueLabel ?? "",
    billNote: body.billNote ?? "",
    status: "pending" as const,
    source: body.source ?? "caregiver",
    createdAt: new Date().toISOString(),
  };

  const updated = await addRequest(session.sub, requestRecord);
  if (!updated) return jsonError("Failed to create request", 500);

  return jsonOk({ request: requestRecord });
}