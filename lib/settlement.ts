import type { Connector } from "@particle-network/connector-core";
import type { UniversalAccount } from "./ua-sdk";
import { hasParticleConfig, getCarePayoutAddress, universalXUrl } from "./particle-config";
import { sendCrossChainCarePayment } from "./universal-account";
import type { SettlementMode } from "./settlement-mode";

export type SettlementResult = {
  ref: string;
  uaTransactionId?: string;
  explorerUrl?: string;
  txHash?: string;
  mode: SettlementMode;
};

export type PaymentSettlementFields = {
  settlementRef: string;
  settlementExplorerUrl?: string;
  settlementMode: SettlementMode;
  uaTransactionId?: string;
  txHash?: string;
};

export class SettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementError";
  }
}

export function paymentToSettlement(payment: {
  settlementRef?: string;
  settlementExplorerUrl?: string;
  settlementMode?: SettlementMode;
}): SettlementResult | null {
  if (!payment.settlementRef) return null;
  return {
    ref: payment.settlementRef,
    explorerUrl: payment.settlementExplorerUrl,
    txHash: payment.settlementMode === "magic" ? payment.settlementRef : undefined,
    mode: payment.settlementMode ?? (payment.settlementExplorerUrl ? "ua" : "magic"),
  };
}

export function settlementPaymentFields(result: SettlementResult): PaymentSettlementFields {
  return {
    settlementRef: result.ref,
    settlementExplorerUrl: result.explorerUrl,
    settlementMode: result.mode,
    uaTransactionId: result.uaTransactionId,
    txHash: result.txHash ?? (result.mode === "magic" ? result.ref : undefined),
  };
}

export async function settleCarePayment(input: {
  amount: number;
  ua?: UniversalAccount | null;
  connector?: Connector | null;
}): Promise<SettlementResult> {
  const { ua, connector } = input;

  if (hasParticleConfig() && ua && connector) {
    const result = await sendCrossChainCarePayment(
      ua,
      connector,
      getCarePayoutAddress(),
      input.amount
    );
    const txId = String(result?.transactionId ?? "");
    if (!txId) {
      throw new SettlementError("Universal Account settlement did not return a transaction ID");
    }
    return {
      ref: `ua:${txId.slice(0, 12)}`,
      uaTransactionId: txId,
      explorerUrl: universalXUrl(txId),
      mode: "ua",
    };
  }

  throw new SettlementError("Connect a Universal Account or sign in with Magic to send care payments");
}