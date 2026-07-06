import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import { confirmSettlementWebhook } from "@/lib/server/settlements";

type Body = {
  uaTransactionId?: string;
  txHash?: string;
  amount?: number;
  status?: string;
};

export async function POST(request: NextRequest) {
  const secret = process.env.SETTLEMENT_WEBHOOK_SECRET;
  if (!secret) {
    return jsonError("Webhook not configured", 503);
  }

  const header = request.headers.get("x-lumina-webhook-secret");
  if (header !== secret) {
    return jsonError("Unauthorized", 401);
  }

  const body = await parseJsonBody<Body>(request);
  if (!body?.uaTransactionId && !body?.txHash) {
    return jsonError("uaTransactionId or txHash required");
  }

  if (body.status && body.status !== "completed" && body.status !== "verified") {
    return jsonError("Ignored status", 200);
  }

  const result = await confirmSettlementWebhook({
    uaTransactionId: body.uaTransactionId,
    txHash: body.txHash,
    amount: body.amount,
  });

  if (result.status === "failed") {
    return jsonError(result.reason ?? "Webhook processing failed", 400);
  }

  return jsonOk(result);
}