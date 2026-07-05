"use client";

import { ExternalLink } from "lucide-react";
import type { PaymentRecord } from "@/lib/allowances";
import { receipt } from "@/lib/copy";

type SettlementProofProps = {
  payment: Pick<PaymentRecord, "settlementRef" | "settlementExplorerUrl" | "settlementMode">;
  variant?: "sheet" | "inline" | "compact";
};

export default function SettlementProof({ payment, variant = "sheet" }: SettlementProofProps) {
  if (!payment.settlementRef) return null;

  const isUa = payment.settlementMode === "ua" || !!payment.settlementExplorerUrl;
  const proofSub = isUa ? receipt.proofUa : receipt.proofDemo;

  if (variant === "compact") {
    return (
      <div className="settlement-proof-compact">
        {isUa && <span className="badge-ua">{receipt.onChain}</span>}
        {payment.settlementExplorerUrl ? (
          <a
            href={payment.settlementExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="settlement-proof-link"
          >
            <ExternalLink size={14} />
            {receipt.viewUniversalX}
          </a>
        ) : (
          <code className="settlement-proof-ref">{payment.settlementRef}</code>
        )}
        <p className="text-caption text-xs">{proofSub}</p>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="settlement-proof-inline">
        {payment.settlementExplorerUrl ? (
          <a
            href={payment.settlementExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="settlement-proof-link"
          >
            <ExternalLink size={14} />
            {receipt.viewUniversalX}
          </a>
        ) : (
          <code className="text-xs font-mono text-mute">{payment.settlementRef}</code>
        )}
      </div>
    );
  }

  return (
    <div className="proof-loop">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-mute">{receipt.proof}</p>
        {isUa && <span className="badge-ua">{receipt.onChain}</span>}
      </div>
      <code className="text-xs text-body font-mono truncate block">{payment.settlementRef}</code>
      <p className="text-caption text-xs mt-2">{proofSub}</p>
      {payment.settlementExplorerUrl && (
        <a
          href={payment.settlementExplorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="settlement-proof-link mt-3"
        >
          <ExternalLink size={14} />
          {receipt.viewUniversalX}
        </a>
      )}
    </div>
  );
}