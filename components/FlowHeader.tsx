"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { pageEnter } from "@/lib/motion";

type FlowHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  badge?: React.ReactNode;
};

export default function FlowHeader({ title, subtitle, onBack, badge }: FlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="flow-header">
      <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
        <ArrowLeft size={20} />
      </button>
      <div className="flow-header-text">
        <div className="flex items-center gap-2">
          <h1 className="flow-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}