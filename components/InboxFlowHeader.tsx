"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand, pull } from "@/lib/copy";

type InboxFlowHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  badge?: React.ReactNode;
};

export default function InboxFlowHeader({
  title,
  subtitle,
  onBack,
  badge,
}: InboxFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="inbox-flow-header">
      <div className="inbox-flow-top">
        {onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="inbox-flow-lockup">
          <span className="inbox-flow-logo">
            <LuminaLogo size={18} className="text-glow" />
          </span>
          <span className="inbox-flow-name">{brand.name}</span>
          <span className="inbox-brand-badge">{pull.eyebrow}</span>
        </div>
      </div>
      <div className="inbox-flow-headline">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="flow-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}