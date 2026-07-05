"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand } from "@/lib/copy";

type AutopilotFlowHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel: string;
  onBack?: () => void;
  hideBack?: boolean;
  badge?: React.ReactNode;
};

export default function AutopilotFlowHeader({
  title,
  subtitle,
  brandLabel,
  onBack,
  hideBack,
  badge,
}: AutopilotFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="autopilot-flow-header">
      <div className="autopilot-flow-top">
        {!hideBack && onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="autopilot-flow-lockup">
          <span className="autopilot-flow-logo">
            <LuminaLogo size={18} className="text-glow" />
          </span>
          <span className="autopilot-flow-name">{brand.name}</span>
          <span className="autopilot-brand-badge">{brandLabel}</span>
        </div>
      </div>
      <div className="autopilot-flow-headline">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="flow-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}