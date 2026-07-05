"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { pageEnter } from "@/lib/motion";
import { brand } from "@/lib/copy";

type SettingsFlowHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel: string;
  onBack?: () => void;
};

export default function SettingsFlowHeader({
  title,
  subtitle,
  brandLabel,
  onBack,
}: SettingsFlowHeaderProps) {
  return (
    <motion.header variants={pageEnter} initial="hidden" animate="show" className="settings-flow-header">
      <div className="settings-flow-top">
        {onBack ? (
          <button type="button" onClick={onBack} className="flow-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="flow-back-spacer" aria-hidden />
        )}
        <div className="settings-flow-lockup">
          <span className="settings-flow-logo">
            <LuminaLogo size={18} className="text-primary" />
          </span>
          <span className="settings-flow-name">{brand.name}</span>
          <span className="settings-brand-badge">{brandLabel}</span>
        </div>
      </div>
      <div className="settings-flow-headline">
        <h1 className="flow-title">{title}</h1>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </div>
    </motion.header>
  );
}