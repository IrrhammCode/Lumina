import type { PaymentRecord } from "@/lib/allowances";
import type { NeedType } from "@/lib/allowances";
import {
  createSettlement,
  createSettlementId,
  getSettlementByUaTx,
  markSettlementVerified,
  type SettlementRecord,
} from "./db";
import { usePostgresStorage } from "./storage-mode";
import { getUserById } from "./db";
import { addPayment, patchRequest, resolvePendingAutopilotPayment, upsertRule } from "./user-data";
import { computeNextRunAt } from "./schedule";
import { allowDemoSettlement, verifyArbitrumUsdtTransfer } from "./settlement-verify";
import type { UserRecord } from "./types";

export type VerifySettlementInput = {
  requestId?: string;
  ruleId?: string;
  memberId?: string;
  needType?: NeedType;
  kind: "pull" | "manual" | "auto";
  amount: number;
  uaTransactionId?: string;
  txHash?: string;
  settlementRef: string;
  explorerUrl?: string;
  settlementMode: "ua" | "demo";
};

export type VerifySettlementResult = {
  status: "verified" | "pending" | "failed";
  settlement?: SettlementRecord;
  payment?: PaymentRecord;
  request?: import("@/lib/requests").CareRequest;
  reason?: string;
};

async function applyVerifiedSettlement(
  user: UserRecord,
  settlement: SettlementRecord
): Promise<VerifySettlementResult> {
  if (settlement.requestId) {
    const existing = user.requests.find((r) => r.id === settlement.requestId);
    if (!existing) {
      return { status: "failed", reason: "Request not found" };
    }
    if (existing.status === "paid") {
      return { status: "verified", settlement, request: existing };
    }
    if (existing.status !== "pending") {
      return { status: "failed", reason: "Request already resolved" };
    }
    const member = user.family.find((m) => m.id === existing.memberId);
    if (!member) return { status: "failed", reason: "Member not found" };

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
      settlementRef: settlement.settlementRef,
      settlementExplorerUrl: settlement.explorerUrl,
      settlementMode: settlement.settlementMode,
    };

    await addPayment(user.id, payment);
    const patched = await patchRequest(user.id, existing.id, {
      status: "paid",
      resolvedAt: new Date().toISOString(),
    });
    if (!patched) return { status: "failed", reason: "Failed to update request" };

    return { status: "verified", settlement, payment, request: patched.request };
  }

  if (settlement.memberId && settlement.needType) {
    const member = user.family.find((m) => m.id === settlement.memberId);
    if (!member) return { status: "failed", reason: "Member not found" };

    const rule = settlement.ruleId
      ? user.rules.find((r) => r.id === settlement.ruleId)
      : undefined;

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      ruleId: settlement.ruleId,
      ruleLabel: rule?.label ?? `${settlement.needType} for ${member.relation}`,
      memberId: member.id,
      memberName: member.name,
      countryCode: member.countryCode,
      needType: settlement.needType as NeedType,
      amount: settlement.amount,
      type: settlement.kind === "auto" ? "auto" : "manual",
      status: "completed",
      date: new Date().toISOString(),
      settlementRef: settlement.settlementRef,
      settlementExplorerUrl: settlement.explorerUrl,
      settlementMode: settlement.settlementMode,
    };

    if (settlement.kind === "auto" && settlement.ruleId) {
      const hadPending = user.payments.some(
        (p) =>
          p.ruleId === settlement.ruleId && p.type === "auto" && p.status === "pending"
      );
      await resolvePendingAutopilotPayment(user.id, settlement.ruleId, payment);
      if (!hadPending && rule) {
        const ranAt = payment.date;
        const onceDone = rule.schedule.type === "once";
        await upsertRule(user.id, {
          ...rule,
          lastRunAt: ranAt,
          nextRunAt: computeNextRunAt(rule.schedule, new Date(ranAt)),
          status: onceDone ? "paused" : rule.status,
        });
      }
    } else {
      await addPayment(user.id, payment);
    }
    return { status: "verified", settlement, payment };
  }

  return { status: "failed", reason: "Invalid settlement target" };
}

export async function verifyAndRecordSettlement(
  userId: string,
  input: VerifySettlementInput
): Promise<VerifySettlementResult> {
  const user = await getUserById(userId);
  if (!user) return { status: "failed", reason: "User not found" };

  if (input.settlementMode === "demo") {
    if (!allowDemoSettlement()) {
      return { status: "failed", reason: "Demo settlements disabled in production" };
    }
    const settlement = await createSettlement({
      id: createSettlementId(),
      userId,
      amount: input.amount,
      kind: input.kind,
      requestId: input.requestId,
      ruleId: input.ruleId,
      memberId: input.memberId,
      needType: input.needType,
      settlementRef: input.settlementRef,
      explorerUrl: input.explorerUrl,
      settlementMode: "demo",
      status: "verified",
    });
    return applyVerifiedSettlement(user, settlement);
  }

  if (input.uaTransactionId) {
    const existing = await getSettlementByUaTx(input.uaTransactionId);
    if (existing?.status === "verified") {
      return applyVerifiedSettlement(user, existing);
    }
  }

  let verified = false;
  let verifyReason: string | undefined;

  if (input.txHash) {
    const chain = await verifyArbitrumUsdtTransfer({
      txHash: input.txHash,
      minAmountUsd: input.amount * 0.99,
    });
    verified = chain.verified;
    verifyReason = chain.reason;
  } else if (!usePostgresStorage() && input.settlementMode === "ua" && allowDemoSettlement()) {
    verified = true;
  }

  const settlement = await createSettlement({
    id: createSettlementId(),
    userId,
    uaTransactionId: input.uaTransactionId,
    txHash: input.txHash,
    amount: input.amount,
    kind: input.kind,
    requestId: input.requestId,
    ruleId: input.ruleId,
    memberId: input.memberId,
    needType: input.needType,
    settlementRef: input.settlementRef,
    explorerUrl: input.explorerUrl,
    settlementMode: "ua",
    status: verified ? "verified" : "pending",
  });

  if (verified) {
    const verifiedRecord = await markSettlementVerified(settlement.id, input.txHash);
    if (!verifiedRecord) return { status: "failed", reason: "Failed to verify settlement" };
    return applyVerifiedSettlement(user, verifiedRecord);
  }

  return {
    status: "pending",
    settlement,
    reason: verifyReason ?? "Awaiting on-chain confirmation or webhook",
  };
}

export async function confirmSettlementWebhook(input: {
  uaTransactionId?: string;
  txHash?: string;
  amount?: number;
}): Promise<VerifySettlementResult> {
  let settlement: SettlementRecord | null = null;

  if (input.uaTransactionId) {
    settlement = await getSettlementByUaTx(input.uaTransactionId);
  }

  if (!settlement) {
    return { status: "failed", reason: "Settlement not found" };
  }

  if (input.txHash) {
    const chain = await verifyArbitrumUsdtTransfer({
      txHash: input.txHash,
      minAmountUsd: (input.amount ?? settlement.amount) * 0.99,
    });
    if (!chain.verified) {
      return { status: "failed", reason: chain.reason ?? "On-chain verification failed" };
    }
  }

  const verified = await markSettlementVerified(settlement.id, input.txHash);
  if (!verified) return { status: "failed", reason: "Failed to update settlement" };

  const user = await getUserById(verified.userId);
  if (!user) return { status: "failed", reason: "User not found" };

  return applyVerifiedSettlement(user, verified);
}