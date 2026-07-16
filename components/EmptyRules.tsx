"use client";

import { motion } from "framer-motion";
import { fadeScale, staggerContainer, staggerItem } from "@/lib/motion";
import { autopilot } from "@/lib/copy";
import { Repeat } from "lucide-react";

const SUGGESTIONS = [
  { label: "Weekly pulsa", need: "pulsa" },
  { label: "School fees", need: "school" },
  { label: "Electricity", need: "electricity" },
];

type EmptyRulesProps = {
  onCreate: () => void;
  onSuggestion?: (need: string) => void;
  variant?: "panel" | "compact";
};

export default function EmptyRules({ onCreate, onSuggestion, variant = "panel" }: EmptyRulesProps) {
  if (variant === "compact") {
    return (
      <motion.div variants={fadeScale} initial="initial" animate="animate" className="empty-rules-compact">
        <span className="empty-rules-compact-icon" aria-hidden>
          <Repeat size={16} />
        </span>
        <div className="empty-rules-compact-body">
          <p className="empty-rules-compact-title">{autopilot.emptyTitle}</p>
          <p className="empty-rules-compact-sub">{autopilot.emptySub}</p>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="empty-rules-compact-chips">
            {SUGGESTIONS.map((s) => (
              <motion.button
                key={s.need}
                variants={staggerItem}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onSuggestion?.(s.need)}
                className="stat-pill text-xs"
              >
                {s.label}
              </motion.button>
            ))}
          </motion.div>
        </div>
        <motion.button
          type="button"
          onClick={onCreate}
          whileTap={{ scale: 0.98 }}
          className="empty-rules-compact-cta"
        >
          {autopilot.emptyCta}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeScale} initial="initial" animate="animate" className="empty-rules-panel text-center">
      <div className="empty-state-icon" aria-hidden>
        <Repeat size={28} />
      </div>
      <p className="text-sm font-bold text-ink mb-1">{autopilot.emptyTitle}</p>
      <p className="text-caption text-xs mb-5 max-w-[240px] mx-auto">{autopilot.emptySub}</p>
      <motion.button type="button" onClick={onCreate} whileTap={{ scale: 0.98 }} className="btn-primary btn-inline mb-4">
        {autopilot.emptyCta}
      </motion.button>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-wrap gap-2 justify-center">
        {SUGGESTIONS.map((s) => (
          <motion.button key={s.need} variants={staggerItem} type="button" whileTap={{ scale: 0.96 }} onClick={() => onSuggestion?.(s.need)} className="stat-pill text-xs">
            {s.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}