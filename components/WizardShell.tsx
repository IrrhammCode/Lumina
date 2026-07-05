"use client";

import { motion } from "framer-motion";
import StepIndicator from "@/components/StepIndicator";
import FlowHeader from "@/components/FlowHeader";
import FamilyFlowHeader from "@/components/FamilyFlowHeader";
import SendFlowHeader from "@/components/SendFlowHeader";
import AutopilotFlowHeader from "@/components/AutopilotFlowHeader";
import OnboardingFlowHeader from "@/components/OnboardingFlowHeader";
import LogFlowHeader from "@/components/LogFlowHeader";
import StickyFooter from "@/components/StickyFooter";
import { pageEnter } from "@/lib/motion";

type WizardShellProps = {
  title: string;
  subtitle?: string;
  step: number;
  stepLabels: string[];
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerSecondary?: React.ReactNode;
  hideSteps?: boolean;
  badge?: React.ReactNode;
  panel?: boolean;
  theme?: "default" | "family" | "send" | "autopilot" | "onboarding" | "log";
  hideBack?: boolean;
  familyBrandLabel?: string;
  sendBrandLabel?: string;
  autopilotBrandLabel?: string;
  onboardingBrandLabel?: string;
  logBrandLabel?: string;
};

export default function WizardShell({
  title,
  subtitle,
  step,
  stepLabels,
  onBack,
  children,
  footer,
  footerSecondary,
  hideSteps,
  badge,
  panel = false,
  theme = "default",
  hideBack = false,
  familyBrandLabel = "Family home",
  sendBrandLabel = "Send now",
  autopilotBrandLabel = "Autopilot",
  onboardingBrandLabel = "Set up",
  logBrandLabel = "Log request",
}: WizardShellProps) {
  const isFamily = theme === "family";
  const isSend = theme === "send";
  const isAutopilot = theme === "autopilot";
  const isOnboarding = theme === "onboarding";
  const isLog = theme === "log";

  return (
    <div
      className={`flow-page ${isFamily ? "flow-page--family" : ""} ${isSend ? "flow-page--send" : ""} ${isAutopilot ? "flow-page--autopilot" : ""} ${isOnboarding ? "flow-page--onboarding" : ""} ${isLog ? "flow-page--log" : ""}`}
    >
      <div className="content-wrap">
        {isFamily ? (
          <FamilyFlowHeader
            title={title}
            subtitle={subtitle}
            brandLabel={familyBrandLabel}
            onBack={onBack}
            hideBack={hideBack}
          />
        ) : isSend ? (
          <SendFlowHeader
            title={title}
            subtitle={subtitle}
            brandLabel={sendBrandLabel}
            onBack={onBack}
            hideBack={hideBack}
            badge={badge}
          />
        ) : isAutopilot ? (
          <AutopilotFlowHeader
            title={title}
            subtitle={subtitle}
            brandLabel={autopilotBrandLabel}
            onBack={onBack}
            hideBack={hideBack}
            badge={badge}
          />
        ) : isOnboarding ? (
          <OnboardingFlowHeader
            title={title}
            subtitle={subtitle}
            brandLabel={onboardingBrandLabel}
            onBack={onBack}
            hideBack={hideBack}
          />
        ) : isLog ? (
          <LogFlowHeader
            title={title}
            subtitle={subtitle}
            brandLabel={logBrandLabel}
            onBack={onBack}
            hideBack={hideBack}
            badge={badge}
          />
        ) : (
          <FlowHeader title={title} subtitle={subtitle} onBack={onBack} badge={badge} />
        )}
        {!hideSteps && (
          <StepIndicator
            current={step}
            labels={stepLabels}
            className={
              isFamily
                ? "step-indicator--family"
                : isSend
                  ? "step-indicator--send"
                  : isAutopilot
                    ? "step-indicator--autopilot"
                    : isOnboarding
                      ? "step-indicator--onboarding"
                      : isLog
                        ? "step-indicator--log"
                        : undefined
            }
          />
        )}
      </div>
      <motion.div
        variants={pageEnter}
        initial="hidden"
        animate="show"
        className="content-wrap flow-body"
      >
        {panel ? <div className="flow-panel">{children}</div> : children}
      </motion.div>
      {footer && (
        <StickyFooter secondary={footerSecondary}>{footer}</StickyFooter>
      )}
    </div>
  );
}