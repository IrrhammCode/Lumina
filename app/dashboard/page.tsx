"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowDownLeft,
  Eye,
  EyeOff,
  TrendingUp,
  Bell,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TransactionCard from "@/components/TransactionCard";

// Demo transaction data
const recentTransactions = [
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
];

export default function DashboardPage() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Check auth state
    const user = localStorage.getItem("lumina_user");
    if (!user) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(user);
    setUserName(parsed.email?.split("@")[0] || "User");
  }, [router]);

  const totalBalance = "2,450.00";
  const savingsThisMonth = "43.50";

  return (
    <div className="min-h-dvh flex flex-col pb-20 gradient-mesh">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-tertiary">Welcome back</p>
          <h1 className="text-lg font-bold text-text-primary capitalize">
            {userName} 👋
          </h1>
        </div>
        <button className="relative p-2.5 rounded-xl glass-light hover:bg-surface-500/50 transition-colors">
          <Bell size={18} className="text-text-secondary" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-accent-coral rounded-full" />
        </button>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-5 mb-5"
      >
        <div className="relative overflow-hidden rounded-3xl p-6 gradient-brand shadow-xl shadow-brand-500/15">
          {/* Decorative circles */}
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute bottom-[-30%] left-[-5%] w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/70 font-medium">
                Total Balance
              </p>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                {balanceVisible ? (
                  <Eye size={16} className="text-white/70" />
                ) : (
                  <EyeOff size={16} className="text-white/70" />
                )}
              </button>
            </div>

            <motion.h2
              key={balanceVisible ? "visible" : "hidden"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-1"
            >
              {balanceVisible ? `$${totalBalance}` : "••••••"}
            </motion.h2>

            <div className="flex items-center gap-1 text-white/70 text-xs">
              <TrendingUp size={12} />
              <span>
                Saved ${savingsThisMonth} in fees this month
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="px-5 mb-6"
      >
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/send")}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl glass-light hover:bg-surface-500/50 active:scale-[0.97] transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-brand-500/15 flex items-center justify-center">
              <Send size={18} className="text-brand-400" />
            </div>
            <span className="text-xs font-semibold text-text-primary">
              Send
            </span>
          </button>

          <button className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl glass-light hover:bg-surface-500/50 active:scale-[0.97] transition-all">
            <div className="w-11 h-11 rounded-full bg-accent-mint/15 flex items-center justify-center">
              <ArrowDownLeft size={18} className="text-accent-mint" />
            </div>
            <span className="text-xs font-semibold text-text-primary">
              Receive
            </span>
          </button>

          <button
            onClick={() => router.push("/history")}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl glass-light hover:bg-surface-500/50 active:scale-[0.97] transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-accent-sky/15 flex items-center justify-center">
              <TrendingUp size={18} className="text-accent-sky" />
            </div>
            <span className="text-xs font-semibold text-text-primary">
              Activity
            </span>
          </button>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="px-5 flex-1"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Recent Transactions
          </h3>
          <button
            onClick={() => router.push("/history")}
            className="text-xs text-brand-400 font-medium"
          >
            See all
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.map((tx, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <TransactionCard {...tx} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
