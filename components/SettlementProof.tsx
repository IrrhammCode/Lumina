"use client";

import { ExternalLink } from "lucide-react";
import type { PaymentRecord } from "@/lib/allowances";
import type { SettlementMode } from "@/lib/settlement-mode";
import { receipt } from "@/lib/copy";

type SettlementProofProps = {
  payment: Pick<PaymentRecord, "settlementRef" | "settlementExplorerUrl" | "settlementMode">;
  variant?: "sheet" | "inline" | "compact";
};

function proofCopy(mode?: SettlementMode, hasExplorer?: boolean): string {
  if (mode === "magic") return receipt.proofMagic;
  if (mode === "ua" || hasExplorer) return receipt.proofUa;
  return receipt.proofOnChain;
}

function explorerLabel(mode?: SettlementMode): string {
  if (mode === "magic") return receipt.viewArbiscan;
  return receipt.viewUniversalX;
}

export default function SettlementProof({ payment, variant = "sheet" }: SettlementProofProps) {
  if (!payment.settlementRef) return null;

  const isOnChain =
    payment.settlementMode === "magic" ||
    payment.settlementMode === "ua" ||
    !!payment.settlementExplorerUrl;
  const proofSub = proofCopy(payment.settlementMode, !!payment.settlementExplorerUrl);
  const linkLabel = explorerLabel(payment.settlementMode);

  if (variant === "compact") {
    return (
      <div className="settlement-proof-compact">
        {isOnChain && <span className="badge-ua">{receipt.onChain}</span>}
        {payment.settlementExplorerUrl ? (
          <a
            href={payment.settlementExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="settlement-proof-link"
          >
            <ExternalLink size={14} />
            {linkLabel}
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
            {linkLabel}
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
        {isOnChain && <span className="badge-ua">{receipt.onChain}</span>}
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
          {linkLabel}
        </a>
      )}
    </div>
  );
}