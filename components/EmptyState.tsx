"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { fadeScale } from "@/lib/motion";

export type EmptyAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  sub?: string;
  actions?: EmptyAction[];
  className?: string;
};

export default function EmptyState({ icon: Icon, title, sub, actions, className = "" }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`empty-state empty-state--rich ${className}`}
    >
      <div className="empty-state-icon">
        <Icon size={22} strokeWidth={2} />
      </div>
      <p className="empty-state-title">{title}</p>
      {sub && <p className="empty-state-sub">{sub}</p>}
      {actions && actions.length > 0 && (
        <div className="empty-state-actions">
          {actions.map((action) => (
            <motion.button
              key={action.label}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={action.variant === "secondary" ? "btn-secondary w-full" : "btn-primary w-full"}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}