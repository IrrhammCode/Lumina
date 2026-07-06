"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { popIn } from "@/lib/motion";

type SettlementErrorBannerProps = {
  message: string;
  sub?: string;
  onDismiss?: () => void;
};

export default function SettlementErrorBanner({
  message,
  sub,
  onDismiss,
}: SettlementErrorBannerProps) {
  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="settlement-error-banner mb-5"
      onClick={onDismiss}
      role={onDismiss ? "button" : undefined}
      tabIndex={onDismiss ? 0 : undefined}
    >
      <AlertCircle size={18} className="text-negative flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{message}</p>
        {sub && <p className="text-caption text-xs mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}