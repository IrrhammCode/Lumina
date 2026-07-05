"use client";

import { motion } from "framer-motion";
import { NEED_META, formatNextRun, type AllowanceRule } from "@/lib/allowances";
import { ChevronRight } from "lucide-react";
import { tapScaleSoft } from "@/lib/motion";
import { autopilot } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";

type NextRunBannerProps = {
  rule: AllowanceRule;
  onClick?: () => void;
};

export default function NextRunBanner({ rule, onClick }: NextRunBannerProps) {
  const meta = NEED_META[rule.needType];

  return (
    <motion.button type="button" onClick={onClick} {...tapScaleSoft} className="next-strip">
      <div className="rule-row-icon" style={{ background: meta.pale, color: meta.accent }}>
        <NeedIcon type={rule.needType} size={18} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">{autopilot.nextLabel}</p>
        <p className="text-sm font-semibold text-ink truncate">{rule.label}</p>
        <p className="text-caption text-xs">{formatNextRun(rule.nextRunAt)} · ${rule.amount.toFixed(0)}</p>
      </div>
      <ChevronRight size={18} className="text-mute flex-shrink-0" />
    </motion.button>
  );
}