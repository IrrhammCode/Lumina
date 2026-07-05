"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type ProcessingOverlayProps = {
  label: string;
  sub?: string;
  className?: string;
};

export default function ProcessingOverlay({ label, sub, className = "" }: ProcessingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`processing-overlay ${className}`}
    >
      <Loader2 size={32} className="animate-spin text-glow" />
      <motion.p
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="processing-overlay-label"
      >
        {label}
      </motion.p>
      {sub && <p className="processing-overlay-sub">{sub}</p>}
    </motion.div>
  );
}