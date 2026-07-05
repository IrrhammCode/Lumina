"use client";

import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";

type Pill = { id: string; label: string };

type FilterPillsProps = {
  items: Pill[];
  active: string;
  onChange: (id: string) => void;
  variant?: "gold" | "ink";
  layoutId?: string;
};

export default function FilterPills({
  items,
  active,
  onChange,
  variant = "gold",
  layoutId = "filter-pill",
}: FilterPillsProps) {
  const activeText = variant === "ink" ? "text-canvas" : "text-on-primary";

  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className="stat-pill relative overflow-hidden"
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className={`absolute inset-0 rounded-pill ${variant === "ink" ? "bg-ink" : "bg-primary"}`}
                transition={springSnappy}
              />
            )}
            <span className={`relative z-[1] ${isActive ? activeText : ""}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}