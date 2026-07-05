"use client";

import { motion, AnimatePresence } from "framer-motion";
import { springSnappy, tweenBase } from "@/lib/motion";

const defaultLabels = ["Who", "What", "When", "Review"];

export default function StepIndicator({
  current,
  total = 4,
  labels = defaultLabels,
  className = "",
}: {
  current: number;
  total?: number;
  labels?: string[];
  className?: string;
}) {
  const progress = total > 1 ? (current / (total - 1)) * 100 : 0;

  return (
    <div className={`px-5 py-3 ${className}`.trim()}>
      <div className="relative step-track mb-3">
        <div className="step-track-bg" />
        <motion.div
          className="step-track-fill"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={springSnappy}
        />
        <div className="step-dots absolute inset-0 flex items-center justify-between">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              className={`step-dot ${i < current ? "done" : ""} ${i === current ? "active" : ""}`}
              animate={{
                scale: i === current ? 1.25 : i < current ? 1.05 : 1,
              }}
              transition={springSnappy}
            />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={tweenBase}
          className="text-center text-caption text-xs"
        >
          Step {current + 1} of {total} · {labels[current] ?? ""}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}