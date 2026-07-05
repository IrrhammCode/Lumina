"use client";

import MemberAvatar from "@/components/MemberAvatar";

interface TransactionCardProps {
  type: "sent" | "received";
  name: string;
  amount: string;
  currency: string;
  date: string;
  status: "completed" | "pending" | "failed";
  countryCode?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function TransactionCard({
  type,
  name,
  amount,
  currency,
  date,
  status,
  countryCode,
  isActive = false,
  onClick,
}: TransactionCardProps) {
  const statusLabel = {
    completed: "Completed",
    pending: "In transit",
    failed: "Failed",
  };

  const statusColor = {
    completed: "text-positive",
    pending: "text-primary",
    failed: "text-negative",
  };

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <button onClick={onClick} className="list-row w-full">
      {countryCode ? (
        <MemberAvatar code={countryCode} size="md" />
      ) : (
        <div className="list-avatar text-xs font-bold">{initials}</div>
      )}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-ink truncate">{name}</p>
        <p className="text-caption text-xs truncate">{date}</p>
      </div>
      {isActive && status === "pending" && (
        <span className="badge-pending mr-1" aria-label="In transit" />
      )}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold tabular-nums ${type === "received" ? "text-positive" : "text-ink"}`}>
          {type === "sent" ? "−" : "+"}{currency} {amount}
        </p>
        <p className={`text-xs font-medium ${statusColor[status]}`}>{statusLabel[status]}</p>
      </div>
    </button>
  );
}