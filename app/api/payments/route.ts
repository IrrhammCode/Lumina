import type { NextRequest } from "next/server";
import type { NeedType } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { verifyAndRecordSettlement } from "@/lib/server/settlements";
import { getUserData } from "@/lib/server/user-data";

type CreateBody = {
  memberId: string;
  needType: NeedType;
  amount: number;
  label?: string;
  type?: "manual" | "auto" | "pull";
  settlementRef?: string;
  settlementExplorerUrl?: string;
  settlementMode?: "ua" | "demo" | "magic";
  txHash?: string;
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
  if (!body?.memberId || !body.needType || !body.amount || !body.settlementRef) {
    return jsonError("memberId, needType, amount, and settlementRef are required");
  }

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  if (!user.family.find((m) => m.id === body.memberId)) {
    return jsonError("Member not found", 404);
  }

  const mode = body.settlementMode ?? "magic";
  const result = await verifyAndRecordSettlement(session.sub, {
    memberId: body.memberId,
    needType: body.needType,
    kind: body.type === "auto" ? "auto" : "manual",
    amount: Number(body.amount),
    settlementRef: body.settlementRef,
    explorerUrl: body.settlementExplorerUrl,
    settlementMode: mode,
    txHash: body.txHash ?? (mode === "magic" ? body.settlementRef : undefined),
  });

  if (result.status === "failed") {
    return jsonError(result.reason ?? "Settlement verification failed", 400);
  }

  return jsonOk({ payment: result.payment, status: result.status });
}