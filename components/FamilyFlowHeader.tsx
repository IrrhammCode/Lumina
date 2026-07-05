"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand } from "@/lib/copy";

type FamilyFlowHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel: string;
  onBack?: () => void;
  hideBack?: boolean;
};

export default function FamilyFlowHeader({
  title,
  subtitle,
  brandLabel,
  onBack,
  hideBack,
}: FamilyFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="family-flow-header">
      <div className="family-flow-top">
        {!hideBack && onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="family-flow-lockup">
          <span className="family-flow-logo">
            <LuminaLogo size={18} className="text-glow" />
          </span>
          <span className="family-flow-name">{brand.name}</span>
          <span className="ask-brand-badge">{brandLabel}</span>
        </div>
      </div>
      <div className="family-flow-headline">
        <h1 className="flow-title">{title}</h1>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}