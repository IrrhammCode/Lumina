"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { popIn } from "@/lib/motion";
import SettlementProof from "@/components/SettlementProof";
import { settlementPaymentFields, type SettlementResult } from "@/lib/settlement";

type ApproveSuccessBannerProps = {
  message: string;
  sub?: string;
  settlement?: SettlementResult | null;
  onDismiss?: () => void;
};

export default function ApproveSuccessBanner({
  message,
  sub,
  settlement,
  onDismiss,
}: ApproveSuccessBannerProps) {
  const proof = settlement ? settlementPaymentFields(settlement) : null;

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="success-banner success-banner--rich mb-5"
      onClick={onDismiss}
      role={onDismiss ? "button" : undefined}
      tabIndex={onDismiss ? 0 : undefined}
    >
      <Check size={18} className="text-positive flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{message}</p>
        {sub && <p className="text-caption text-xs mt-0.5">{sub}</p>}
        {proof?.settlementRef && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <SettlementProof payment={proof} variant="inline" />
          </div>
        )}
      </div>
    </motion.div>
  );
}