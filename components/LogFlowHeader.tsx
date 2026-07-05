"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand } from "@/lib/copy";

type LogFlowHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel: string;
  onBack?: () => void;
  hideBack?: boolean;
  badge?: React.ReactNode;
};

export default function LogFlowHeader({
  title,
  subtitle,
  brandLabel,
  onBack,
  hideBack,
  badge,
}: LogFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="log-flow-header">
      <div className="log-flow-top">
        {!hideBack && onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="log-flow-lockup">
          <span className="log-flow-logo">
            <LuminaLogo size={18} className="text-positive-deep" />
          </span>
          <span className="log-flow-name">{brand.name}</span>
          <span className="log-brand-badge">{brandLabel}</span>
        </div>
      </div>
      <div className="log-flow-headline">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="flow-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}