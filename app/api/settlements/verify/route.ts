import type { NextRequest } from "next/server";
import type { NeedType } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { verifyAndRecordSettlement } from "@/lib/server/settlements";

type Body = {
  requestId?: string;
  ruleId?: string;
  memberId?: string;
  needType?: NeedType;
  kind?: "pull" | "manual" | "auto";
  amount?: number;
  uaTransactionId?: string;
  txHash?: string;
  settlementRef?: string;
  explorerUrl?: string;
  settlementMode?: "ua" | "demo" | "magic";
};

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<Body>(request);
  if (!body?.amount || body.amount <= 0 || !body.settlementRef) {
    return jsonError("amount and settlementRef are required");
  }

  const result = await verifyAndRecordSettlement(session.sub, {
    requestId: body.requestId,
    ruleId: body.ruleId,
    memberId: body.memberId,
    needType: body.needType,
    kind: body.kind ?? (body.requestId ? "pull" : "manual"),
    amount: Number(body.amount),
    uaTransactionId: body.uaTransactionId,
    txHash: body.txHash,
    settlementRef: body.settlementRef,
    explorerUrl: body.explorerUrl,
    settlementMode: body.settlementMode ?? "magic",
  });

  if (result.status === "failed") {
    return jsonError(result.reason ?? "Settlement verification failed", 400);
  }

  return jsonOk(result);
}