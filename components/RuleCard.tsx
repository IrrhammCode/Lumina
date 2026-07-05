"use client";

import { motion } from "framer-motion";
import { NEED_META, formatSchedule, formatNextRun, type AllowanceRule } from "@/lib/allowances";
import { getMemberById } from "@/lib/family";
import { tapScaleSoft } from "@/lib/motion";
import { autopilot } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";

type RuleCardProps = {
  rule: AllowanceRule;
  onToggle?: (id: string) => void;
  onClick?: (id: string) => void;
  showToggle?: boolean;
  variant?: "card" | "row";
};

export default function RuleCard({
  rule,
  onToggle,
  onClick,
  showToggle = true,
  variant = "row",
}: RuleCardProps) {
  const meta = NEED_META[rule.needType];
  const member = getMemberById(rule.memberId);
  const isPaused = rule.status === "paused";

  const iconCell = (
    <div className="rule-row-icon" style={{ background: meta.pale, color: meta.accent }}>
      <NeedIcon type={rule.needType} size={18} />
    </div>
  );

  if (variant === "row") {
    return (
      <motion.div
        role="button"
        tabIndex={0}
        layout
        {...tapScaleSoft}
        onClick={() => onClick?.(rule.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(rule.id);
          }
        }}
        className={`rule-row ${isPaused ? "paused" : ""}`}
      >
        {iconCell}
        <div className="rule-row-body">
          <p className="rule-row-title">{rule.label}</p>
          <p className="rule-row-sub">
            {member?.relation} · {formatSchedule(rule)}
          </p>
        </div>
        <div className="rule-row-end">
          <p className="rule-row-amount">${rule.amount.toFixed(0)}</p>
          <p className="rule-row-when">{isPaused ? autopilot.paused : formatNextRun(rule.nextRunAt)}</p>
        </div>
        {showToggle && onToggle && (
          <button
            type="button"
            className={`toggle-switch ${rule.status === "active" ? "on" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(rule.id);
            }}
            aria-label={rule.status === "active" ? autopilot.ariaPause : autopilot.ariaActivate}
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div layout {...tapScaleSoft} className={`rule-card ${isPaused ? "paused" : ""}`}>
      <motion.div
        className="rule-accent"
        animate={{ background: isPaused ? "var(--color-border-soft)" : meta.accent }}
        transition={{ duration: 0.25 }}
      />
      <button
        type="button"
        className="rule-body flex items-center gap-3 border-none bg-transparent p-0 text-left"
        onClick={() => onClick?.(rule.id)}
      >
        <NeedIcon type={rule.needType} variant="tile" size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-ink truncate">{rule.label}</p>
            {rule.status === "active" && <span className="badge-auto">Auto</span>}
          </div>
          <p className="text-caption text-xs mt-0.5">
            {member?.relation} · {formatSchedule(rule)}
          </p>
          <p className="text-xs font-semibold text-ink mt-1 tabular-nums">
            ${rule.amount.toFixed(2)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-caption text-xs">{isPaused ? autopilot.paused : formatNextRun(rule.nextRunAt)}</p>
        </div>
      </button>
      {showToggle && onToggle && (
        <div className="flex items-center pr-3 pl-1">
          <button
            type="button"
            className={`toggle-switch ${rule.status === "active" ? "on" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(rule.id);
            }}
            aria-label={rule.status === "active" ? autopilot.ariaPause : autopilot.ariaActivate}
          />
        </div>
      )}
    </motion.div>
  );
}