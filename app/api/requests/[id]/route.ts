import type { NextRequest } from "next/server";
import type { PaymentRecord } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { addPayment, getUserData, patchRequest } from "@/lib/server/user-data";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  action?: "decline" | "approve";
  settlement?: {
    settlementRef?: string;
    settlementExplorerUrl?: string;
    settlementMode?: "ua" | "demo";
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const item = user.requests.find((r) => r.id === id);
  if (!item) return jsonError("Request not found", 404);

  return jsonOk({ request: item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const body = await parseJsonBody<PatchBody>(request);
  if (!body?.action) return jsonError("action is required");

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const existing = user.requests.find((r) => r.id === id);
  if (!existing || existing.status !== "pending") {
    return jsonError("Request not found or already resolved", 404);
  }

  if (body.action === "decline") {
    const result = await patchRequest(session.sub, id, {
      status: "declined",
      resolvedAt: new Date().toISOString(),
    });
    if (!result) return jsonError("Update failed", 500);
    return jsonOk({ request: result.request });
  }

  const member = user.family.find((m) => m.id === existing.memberId);
  if (!member) return jsonError("Member not found", 404);

  const payment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    requestId: existing.id,
    ruleLabel: existing.title,
    memberId: member.id,
    memberName: member.name,
    countryCode: member.countryCode,
    needType: existing.needType,
    amount: existing.amount,
    type: "pull",
    status: "completed",
    date: new Date().toISOString(),
    settlementRef: body.settlement?.settlementRef ?? `0x${Math.random().toString(16).slice(2, 10)}…arb`,
    settlementExplorerUrl: body.settlement?.settlementExplorerUrl,
    settlementMode: body.settlement?.settlementMode ?? (body.settlement?.settlementExplorerUrl ? "ua" : "demo"),
  };

  await addPayment(session.sub, payment);

  const result = await patchRequest(session.sub, id, {
    status: "paid",
    resolvedAt: new Date().toISOString(),
  });
  if (!result) return jsonError("Update failed", 500);

  return jsonOk({ request: result.request, payment });
}