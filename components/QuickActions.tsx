"use client";

import { motion } from "framer-motion";
import { Send, Repeat, Inbox, HandHelping } from "lucide-react";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { quick } from "@/lib/copy";

type QuickActionsProps = {
  pendingCount?: number;
  variant?: "grid" | "row";
};

export default function QuickActions({ pendingCount = 0, variant = "grid" }: QuickActionsProps) {
  const router = useRouter();

  const items = [
    { icon: Send, label: quick.send, href: "/pay", accent: "action-gold" },
    { icon: HandHelping, label: quick.ask, href: "/ask", accent: "action-warm" },
    { icon: Repeat, label: quick.rule, href: "/rules/new", accent: "action-violet" },
    { icon: Inbox, label: quick.inbox, href: "/requests", accent: "action-sage", badge: pendingCount },
  ];

  if (variant === "row") {
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="action-row scrollbar-hide">
        {items.map((a) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.href}
              variants={staggerItem}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push(a.href)}
              className="action-row-tile action-row-tile-4"
            >
              <span className={`action-row-icon action-tile-icon ${a.accent}`}>
                <Icon size={20} strokeWidth={2} />
                {a.badge !== undefined && a.badge > 0 && (
                  <span className="action-badge">{a.badge}</span>
                )}
              </span>
              <span className="action-row-label">{a.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="action-grid">
      {items.map((a) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.href}
            variants={staggerItem}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(a.href)}
            className={`action-tile ${a.accent}`}
          >
            <span className="action-tile-icon">
              <Icon size={20} strokeWidth={2} />
              {a.badge !== undefined && a.badge > 0 && (
                <span className="action-badge">{a.badge}</span>
              )}
            </span>
            <span className="action-tile-label">{a.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}