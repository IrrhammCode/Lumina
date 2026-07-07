"use client";

import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { home } from "@/lib/copy";

type BalanceCardProps = {
  balance: string;
  visible: boolean;
  onToggle: () => void;
  stats: { value: string; label: string }[];
  balanceLabel?: string;
  accountBadge?: string;
  extraBadge?: ReactNode;
  highlightAwaiting?: boolean;
};

export default function BalanceCard({
  balance,
  visible,
  onToggle,
  stats,
  balanceLabel = home.balanceLabel,
  accountBadge,
  extraBadge,
  highlightAwaiting = false,
}: BalanceCardProps) {
  return (
    <div className="balance-float">
      <div className="balance-float-top">
        <p className="balance-float-label">{balanceLabel}</p>
        <button
          type="button"
          onClick={onToggle}
          className="balance-float-eye"
          aria-label="Toggle balance"
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      <p className="balance-float-amount">
        {visible ? balance : "••••••"}
        {visible && !balance.includes(".") && <span className="balance-float-cents">.00</span>}
      </p>
      {((accountBadge && visible) || extraBadge) && (
        <div className="balance-float-badges">
          {accountBadge && visible && (
            <span className="balance-float-badge">{accountBadge}</span>
          )}
          {extraBadge}
        </div>
      )}
      <div className="balance-float-stats">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`balance-float-stat ${highlightAwaiting && i === stats.length - 1 ? "balance-float-stat--alert" : ""}`}
          >
            <p className="balance-float-stat-value">{s.value}</p>
            <p className="balance-float-stat-label">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}