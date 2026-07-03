"use client";

import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface TransactionCardProps {
  type: "sent" | "received";
  name: string;
  amount: string;
  currency: string;
  date: string;
  status: "completed" | "pending" | "failed";
  onClick?: () => void;
}

export default function TransactionCard({
  type,
  name,
  amount,
  currency,
  date,
  status,
  onClick,
}: TransactionCardProps) {
  const statusColors = {
    completed: "text-accent-mint",
    pending: "text-accent-amber",
    failed: "text-accent-coral",
  };

  const statusLabels = {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl glass-light hover:bg-surface-500/50 transition-all active:scale-[0.98] text-left"
    >
      {/* Icon */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full ${
          type === "sent"
            ? "bg-accent-coral/15 text-accent-coral"
            : "bg-accent-mint/15 text-accent-mint"
        }`}
      >
        {type === "sent" ? (
          <ArrowUpRight size={18} strokeWidth={2.5} />
        ) : (
          <ArrowDownLeft size={18} strokeWidth={2.5} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {name}
        </p>
        <p className="text-xs text-text-tertiary">{date}</p>
      </div>

      {/* Amount & Status */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-bold ${
            type === "sent" ? "text-text-primary" : "text-accent-mint"
          }`}
        >
          {type === "sent" ? "-" : "+"}
          {currency} {amount}
        </p>
        <p className={`text-xs ${statusColors[status]}`}>
          {statusLabels[status]}
        </p>
      </div>
    </button>
  );
}
