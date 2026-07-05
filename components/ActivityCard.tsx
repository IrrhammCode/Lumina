"use client";

import { motion } from "framer-motion";
import { NEED_META, type PaymentRecord } from "@/lib/allowances";
import { tapScaleSoft } from "@/lib/motion";
import { receipt } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";
import { ExternalLink } from "lucide-react";

type ActivityCardProps = {
  payment: PaymentRecord;
  onClick?: () => void;
  variant?: "row" | "timeline";
};

export default function ActivityCard({ payment, onClick, variant = "timeline" }: ActivityCardProps) {
  const meta = NEED_META[payment.needType];
  const dateStr = new Date(payment.date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const typeClass = payment.type === "pull" ? "pull" : payment.type === "auto" ? "auto" : "";

  const iconCell = (
    <div className="rule-row-icon" style={{ background: meta.pale, color: meta.accent }}>
      <NeedIcon type={payment.needType} size={16} />
    </div>
  );

  const subline = `${payment.memberName} · ${dateStr}`;

  if (variant === "timeline") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        {...tapScaleSoft}
        className={`timeline-item timeline-item-card ${typeClass}`}
      >
        {iconCell}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">
            {payment.ruleLabel ?? meta.label}
          </p>
          <p className="text-caption text-xs truncate">{subline}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold tabular-nums">−${payment.amount.toFixed(0)}</p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            {payment.settlementExplorerUrl && (
              <a
                href={payment.settlementExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="activity-ua-link"
                aria-label={receipt.viewUniversalX}
              >
                <ExternalLink size={10} />
              </a>
            )}
            {payment.type === "pull" && <span className="badge-pull text-[9px]">{receipt.types.pull}</span>}
            {payment.type === "auto" && <span className="badge-auto text-[9px]">{receipt.types.auto}</span>}
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} {...tapScaleSoft} className="list-row w-full">
      <NeedIcon type={payment.needType} variant="tile" size={16} />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-ink truncate">{payment.ruleLabel ?? meta.label}</p>
        <p className="text-caption text-xs truncate">{subline}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold tabular-nums">−${payment.amount.toFixed(2)}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {payment.settlementExplorerUrl && (
            <a
              href={payment.settlementExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="activity-ua-link"
              aria-label={receipt.viewUniversalX}
            >
              <ExternalLink size={10} />
            </a>
          )}
          {payment.type === "pull" && <span className="badge-pull text-[9px]">{receipt.types.pull}</span>}
          {payment.type === "auto" && <span className="badge-auto text-[9px]">{receipt.types.auto}</span>}
          {payment.type === "manual" && <span className="badge-manual text-[9px]">{receipt.types.manual}</span>}
        </div>
      </div>
    </motion.button>
  );
}