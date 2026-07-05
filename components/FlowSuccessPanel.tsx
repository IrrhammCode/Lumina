"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fadeScale } from "@/lib/motion";
import type { SuccessAction } from "@/components/PaymentSuccessPanel";

type FlowSuccessPanelProps = {
  title: string;
  body: string;
  hint?: string;
  meta?: { label: string; value: string }[];
  actions?: SuccessAction[];
  panel?: boolean;
};

export default function FlowSuccessPanel({
  title,
  body,
  hint,
  meta,
  actions,
  panel = true,
}: FlowSuccessPanelProps) {
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

      {meta && meta.length > 0 && (
        <div className="flow-success-meta">
          {meta.map((row) => (
            <div key={row.label} className="flow-success-meta-row">
              <span className="text-caption text-xs">{row.label}</span>
              <span className="text-sm font-semibold text-ink">{row.value}</span>
            </div>
          ))}
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