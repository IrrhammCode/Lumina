"use client";

import { motion } from "framer-motion";

interface CostComparisonProps {
  amount: number;
  currency?: string;
}

const competitors = [
  {
    name: "Lumina",
    fee: 0.0,
    feePercent: 0,
    time: "~10 seconds",
    highlight: true,
    gradient: "from-brand-500 to-brand-400",
  },
  {
    name: "Wise",
    fee: 6.5,
    feePercent: 1.3,
    time: "1-2 days",
    highlight: false,
    gradient: "from-emerald-600 to-emerald-500",
  },
  {
    name: "Western Union",
    fee: 12.0,
    feePercent: 2.4,
    time: "Minutes - 5 days",
    highlight: false,
    gradient: "from-yellow-600 to-yellow-500",
  },
  {
    name: "Bank Transfer",
    fee: 25.0,
    feePercent: 5.0,
    time: "3-5 business days",
    highlight: false,
    gradient: "from-gray-600 to-gray-500",
  },
];

export default function CostComparison({
  amount,
  currency = "USD",
}: CostComparisonProps) {
  const maxFee = Math.max(...competitors.map((c) => c.fee));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Fee Comparison for {currency} {amount.toFixed(2)}
      </h3>

      <div className="space-y-2.5">
        {competitors.map((comp, index) => {
          const recipientGets = amount - comp.fee;
          const barWidth = maxFee === 0 ? 0 : (comp.fee / maxFee) * 100;

          return (
            <motion.div
              key={comp.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-3.5 transition-all ${
                comp.highlight
                  ? "glass border-brand-500/30 border"
                  : "glass-light"
              }`}
            >
              {comp.highlight && (
                <div className="absolute -top-2.5 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full gradient-brand text-white">
                    Best Rate
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      comp.highlight ? "text-brand-300" : "text-text-primary"
                    }`}
                  >
                    {comp.name}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold ${
                      comp.highlight ? "text-accent-mint" : "text-text-primary"
                    }`}
                  >
                    {comp.fee === 0 ? "FREE" : `$${comp.fee.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Fee bar */}
              <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: comp.fee === 0 ? "2%" : `${barWidth}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                  className={`h-full rounded-full bg-gradient-to-r ${comp.gradient}`}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">{comp.time}</span>
                <span
                  className={`text-xs ${
                    comp.highlight
                      ? "text-accent-mint font-medium"
                      : "text-text-secondary"
                  }`}
                >
                  Recipient gets: ${recipientGets.toFixed(2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Savings callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center py-3 px-4 rounded-2xl bg-accent-mint/10 border border-accent-mint/20"
      >
        <p className="text-accent-mint text-sm font-semibold">
          💸 You save up to ${maxFee.toFixed(2)} with Lumina
        </p>
        <p className="text-text-tertiary text-xs mt-0.5">
          No hidden fees. No exchange rate markup.
        </p>
      </motion.div>
    </div>
  );
}
