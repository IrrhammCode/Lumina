"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TransactionCard from "@/components/TransactionCard";

const allTransactions = [
  {
    type: "sent" as const,
    name: "Maria Santos",
    amount: "200.00",
    currency: "USD",
    date: "Today, 2:30 PM",
    status: "completed" as const,
  },
  {
    type: "received" as const,
    name: "John Doe",
    amount: "150.00",
    currency: "USD",
    date: "Yesterday, 10:15 AM",
    status: "completed" as const,
  },
  {
    type: "sent" as const,
    name: "Priya Sharma",
    amount: "500.00",
    currency: "USD",
    date: "Jul 1, 5:45 PM",
    status: "pending" as const,
  },
  {
    type: "sent" as const,
    name: "James Mwangi",
    amount: "75.00",
    currency: "USD",
    date: "Jun 30, 9:00 AM",
    status: "completed" as const,
  },
  {
    type: "received" as const,
    name: "Ana Rodriguez",
    amount: "300.00",
    currency: "USD",
    date: "Jun 28, 3:22 PM",
    status: "completed" as const,
  },
  {
    type: "sent" as const,
    name: "Anh Nguyen",
    amount: "125.00",
    currency: "USD",
    date: "Jun 25, 11:30 AM",
    status: "completed" as const,
  },
  {
    type: "sent" as const,
    name: "Maria Santos",
    amount: "200.00",
    currency: "USD",
    date: "Jun 20, 8:15 PM",
    status: "completed" as const,
  },
];

export default function HistoryPage() {
  const router = useRouter();

  // Group by date
  const today = allTransactions.filter((t) => t.date.startsWith("Today"));
  const yesterday = allTransactions.filter((t) =>
    t.date.startsWith("Yesterday")
  );
  const earlier = allTransactions.filter(
    (t) => !t.date.startsWith("Today") && !t.date.startsWith("Yesterday")
  );

  return (
    <div className="min-h-dvh flex flex-col pb-20 gradient-mesh">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 rounded-xl hover:bg-surface-600/50 transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">
          Transaction History
        </h1>
      </div>

      {/* Summary */}
      <div className="px-5 mb-4">
        <div className="flex gap-3">
          <div className="flex-1 glass-light rounded-2xl p-3.5 text-center">
            <p className="text-xs text-text-tertiary mb-0.5">Total Sent</p>
            <p className="text-lg font-bold text-accent-coral">$1,100.00</p>
          </div>
          <div className="flex-1 glass-light rounded-2xl p-3.5 text-center">
            <p className="text-xs text-text-tertiary mb-0.5">Total Received</p>
            <p className="text-lg font-bold text-accent-mint">$450.00</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-5 flex-1 space-y-5">
        {today.length > 0 && (
          <TransactionGroup label="Today" transactions={today} />
        )}
        {yesterday.length > 0 && (
          <TransactionGroup label="Yesterday" transactions={yesterday} />
        )}
        {earlier.length > 0 && (
          <TransactionGroup label="Earlier" transactions={earlier} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function TransactionGroup({
  label,
  transactions,
}: {
  label: string;
  transactions: typeof allTransactions;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="space-y-2">
        {transactions.map((tx, index) => (
          <motion.div
            key={`${tx.name}-${tx.date}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <TransactionCard {...tx} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
