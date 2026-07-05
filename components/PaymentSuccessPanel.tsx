"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fadeScale } from "@/lib/motion";
import SettlementProof from "@/components/SettlementProof";
import { settlementPaymentFields, type SettlementResult } from "@/lib/settlement";

export type SuccessAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type PaymentSuccessPanelProps = {
  title: string;
  body: string;
  hint?: string;
  settlement?: SettlementResult | null;
  actions?: SuccessAction[];
  panel?: boolean;
};

export default function PaymentSuccessPanel({
  title,
  body,
  hint,
  settlement,
  actions,
  panel = true,
}: PaymentSuccessPanelProps) {
  const proof = settlement ? settlementPaymentFields(settlement) : null;

  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={panel ? "payment-success payment-success--panel" : "payment-success"}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="payment-success-icon"
      >
        <Check size={panel ? 28 : 32} strokeWidth={3} />
      </motion.div>

      <h2 className="payment-success-title">{title}</h2>
      <p className="payment-success-body">{body}</p>
      {hint && <p className="payment-success-hint">{hint}</p>}

      {proof?.settlementRef && (
        <div className="payment-success-proof">
          <SettlementProof payment={proof} variant="compact" />
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="payment-success-actions">
          {actions.map((action) => (
            <motion.button
              key={action.label}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={action.variant === "secondary" ? "btn-secondary w-full" : "btn-primary"}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}