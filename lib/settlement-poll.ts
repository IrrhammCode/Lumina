import { api } from "./api-client";
import type { NeedType, PaymentRecord } from "./allowances";
import type { PaymentSettlementFields } from "./settlement";
import { hydrateFromServer } from "./sync";

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 30;

export async function pollSettlementVerified(settlementId: string): Promise<boolean> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    const result = await api.getSettlement(settlementId);
    if (result.ok && result.data.settlement.status === "verified") {
      await hydrateFromServer();
      return true;
    }
    if (result.ok && result.data.settlement.status === "failed") {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

export type ConfirmSettlementInput = {
  requestId?: string;
  ruleId?: string;
  memberId?: string;
  needType?: NeedType;
  amount: number;
  kind: "pull" | "manual" | "auto";
  settlement: PaymentSettlementFields;
};

export async function confirmSettlementAfterPay(
  input: ConfirmSettlementInput
): Promise<{ ok: true; payment?: PaymentRecord } | { ok: false; reason?: string }> {
  const remote = await api.verifySettlement({
    requestId: input.requestId,
    ruleId: input.ruleId,
    memberId: input.memberId,
    needType: input.needType,
    kind: input.kind,
    amount: input.amount,
    settlementRef: input.settlement.settlementRef,
    explorerUrl: input.settlement.settlementExplorerUrl,
    settlementMode: input.settlement.settlementMode,
    uaTransactionId: input.settlement.uaTransactionId,
    txHash: input.settlement.txHash,
  });

  if (!remote.ok) {
    return { ok: false, reason: remote.error };
  }

  if (remote.data.status === "verified") {
    await hydrateFromServer();
    return { ok: true, payment: remote.data.payment };
  }

  if (remote.data.status === "pending" && remote.data.settlement?.id) {
    const verified = await pollSettlementVerified(remote.data.settlement.id);
    if (verified) {
      return { ok: true, payment: remote.data.payment };
    }
    return { ok: false, reason: "Awaiting on-chain confirmation" };
  }

  return { ok: false, reason: remote.data.reason ?? "Settlement verification failed" };
}