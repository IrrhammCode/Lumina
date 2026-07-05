"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand } from "@/lib/copy";

type OnboardingFlowHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel: string;
  onBack?: () => void;
  hideBack?: boolean;
};

export default function OnboardingFlowHeader({
  title,
  subtitle,
  brandLabel,
  onBack,
  hideBack,
}: OnboardingFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="onboard-flow-header">
      <div className="onboard-flow-top">
        {!hideBack && onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="onboard-flow-lockup">
          <span className="onboard-flow-logo">
            <LuminaLogo size={18} className="text-primary" />
          </span>
          <span className="onboard-flow-name">{brand.name}</span>
          <span className="onboard-brand-badge">{brandLabel}</span>
        </div>
      </div>
      <div className="onboard-flow-headline">
        <h1 className="flow-title">{title}</h1>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}