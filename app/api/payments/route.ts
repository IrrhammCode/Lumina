import type { NextRequest } from "next/server";
import type { NeedType, PaymentRecord } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { addPayment, getUserData } from "@/lib/server/user-data";

type CreateBody = {
  memberId: string;
  needType: NeedType;
  amount: number;
  label?: string;
  type?: PaymentRecord["type"];
  settlementRef?: string;
  settlementExplorerUrl?: string;
  settlementMode?: "ua" | "demo";
};

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ payments: user.payments });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<CreateBody>(request);
  if (!body?.memberId || !body.needType) {
    return jsonError("Invalid payment payload");
  }

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const member = user.family.find((m) => m.id === body.memberId);
  if (!member) return jsonError("Member not found", 404);

  const payment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    ruleLabel: body.label ?? `${body.needType} for ${member.relation}`,
    memberId: member.id,
    memberName: member.name,
    countryCode: member.countryCode,
    needType: body.needType,
    amount: Number(body.amount) || 0,
    type: body.type ?? "manual",
    status: "completed",
    date: new Date().toISOString(),
    settlementRef: body.settlementRef ?? `0x${Math.random().toString(16).slice(2, 10)}…arb`,
    settlementExplorerUrl: body.settlementExplorerUrl,
    settlementMode: body.settlementMode ?? (body.settlementExplorerUrl ? "ua" : "demo"),
  };

  const updated = await addPayment(session.sub, payment);
  if (!updated) return jsonError("Failed to record payment", 500);

  return jsonOk({ payment });
}