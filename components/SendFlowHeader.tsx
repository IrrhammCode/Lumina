"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand } from "@/lib/copy";

type SendFlowHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel: string;
  onBack?: () => void;
  hideBack?: boolean;
  badge?: React.ReactNode;
};

export default function SendFlowHeader({
  title,
  subtitle,
  brandLabel,
  onBack,
  hideBack,
  badge,
}: SendFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="send-flow-header">
      <div className="send-flow-top">
        {!hideBack && onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="send-flow-lockup">
          <span className="send-flow-logo">
            <LuminaLogo size={18} className="text-primary" />
          </span>
          <span className="send-flow-name">{brand.name}</span>
          <span className="pay-brand-badge">{brandLabel}</span>
        </div>
      </div>
      <div className="send-flow-headline">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="flow-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}