import type { Connector } from "@particle-network/connector-core";
import type { UniversalAccount } from "./ua-sdk";
import { hasParticleConfig, getCarePayoutAddress, universalXUrl } from "./particle-config";
import { sendCrossChainCarePayment } from "./universal-account";

export type SettlementResult = {
  ref: string;
  uaTransactionId?: string;
  explorerUrl?: string;
  mode: "ua" | "demo";
};

export type PaymentSettlementFields = {
  settlementRef: string;
  settlementExplorerUrl?: string;
  settlementMode: "ua" | "demo";
};

export function paymentToSettlement(payment: {
  settlementRef?: string;
  settlementExplorerUrl?: string;
  settlementMode?: "ua" | "demo";
}): SettlementResult | null {
  if (!payment.settlementRef) return null;
  return {
    ref: payment.settlementRef,
    explorerUrl: payment.settlementExplorerUrl,
    mode: payment.settlementMode ?? (payment.settlementExplorerUrl ? "ua" : "demo"),
  };
}

export function settlementPaymentFields(result: SettlementResult): PaymentSettlementFields {
  return {
    settlementRef: result.ref,
    settlementExplorerUrl: result.explorerUrl,
    settlementMode: result.mode,
  };
}

export async function settleCarePayment(input: {
  amount: number;
  ua?: UniversalAccount | null;
  connector?: Connector | null;
}): Promise<SettlementResult> {
  const { amount, ua, connector } = input;

  if (hasParticleConfig() && ua && connector) {
    try {
      const result = await sendCrossChainCarePayment(
        ua,
        connector,
        getCarePayoutAddress(),
        amount
      );
      const txId = String(result?.transactionId ?? "");
      return {
        ref: txId ? `ua:${txId.slice(0, 12)}` : `0x${Math.random().toString(16).slice(2, 10)}`,
        uaTransactionId: txId || undefined,
        explorerUrl: txId ? universalXUrl(txId) : undefined,
        mode: "ua",
      };
    } catch (error) {
      console.error("UA settlement failed, falling back to demo:", error);
    }
  }

  return {
    ref: `0x${Math.random().toString(16).slice(2, 10)}…arb`,
    mode: "demo",
  };
}