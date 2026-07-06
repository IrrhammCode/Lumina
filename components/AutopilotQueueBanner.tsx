"use client";

import { motion } from "framer-motion";
import { Repeat, ChevronRight } from "lucide-react";
import type { PaymentRecord } from "@/lib/allowances";
import type { AllowanceRule } from "@/lib/allowances";
import { tapScaleSoft } from "@/lib/motion";
import { autopilot } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";
import { NEED_META } from "@/lib/allowances";

type AutopilotQueueBannerProps = {
  payment: PaymentRecord;
  rule?: AllowanceRule;
  onSettle: () => void;
};

export default function AutopilotQueueBanner({ payment, rule, onSettle }: AutopilotQueueBannerProps) {
  const meta = NEED_META[payment.needType];
  const label = rule?.label ?? payment.ruleLabel;

  return (
    <motion.button type="button" onClick={onSettle} {...tapScaleSoft} className="next-strip next-strip--queue">
      <div className="rule-row-icon" style={{ background: meta.pale, color: meta.accent }}>
        <NeedIcon type={payment.needType} size={18} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5 flex items-center gap-1">
          <Repeat size={10} />
          {autopilot.queueLabel}
        </p>
        <p className="text-sm font-semibold text-ink truncate">{label}</p>
        <p className="text-caption text-xs">{autopilot.queueSub(payment.amount)}</p>
      </div>
      <ChevronRight size={18} className="text-mute flex-shrink-0" />
    </motion.button>
  );
}