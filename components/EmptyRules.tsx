"use client";

import { motion } from "framer-motion";
import { Repeat } from "lucide-react";
import { fadeScale, staggerContainer, staggerItem } from "@/lib/motion";
import { autopilot } from "@/lib/copy";

const SUGGESTIONS = [
  { label: "Weekly pulsa", need: "pulsa" },
  { label: "School fees", need: "school" },
  { label: "Electricity", need: "electricity" },
];

type EmptyRulesProps = {
  onCreate: () => void;
  onSuggestion?: (need: string) => void;
};

export default function EmptyRules({ onCreate, onSuggestion }: EmptyRulesProps) {
  return (
    <motion.div variants={fadeScale} initial="initial" animate="animate" className="empty-rules-panel text-center">
      <div className="empty-rules-icon">
        <Repeat size={22} className="text-glow" />
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