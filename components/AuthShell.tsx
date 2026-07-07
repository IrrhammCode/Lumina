"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import LuminaLogo from "@/components/LuminaLogo";
import { brand, auth } from "@/lib/copy";

type AuthShellProps = {
  variant?: "welcome" | "login";
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({
  variant = "login",
  title,
  subtitle,
  onBack,
  children,
  footer,
}: AuthShellProps) {
  if (variant === "welcome") {
    return (
      <div className="auth-page">
        <div className="auth-brand-band">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="auth-brand-inner"
          >
            <div className="auth-logo-lockup">
              <div className="auth-logo-mark">
                <LuminaLogo size={24} />
              </div>
              <span className="auth-logo-name">{brand.name}</span>
            </div>
            <h1 className="auth-tagline">
              They ask.
              <br />
              <span className="auth-tagline-accent">You approve.</span>
            </h1>
            <p className="auth-tagline-sub">{brand.sub}</p>
          </motion.div>
        </div>
        <div className="auth-body">{children}</div>
        {footer && <div className="auth-sticky-cta">{footer}</div>}
      </div>
    );
  }

  return (
    <div className="auth-page auth-page-login">
      <div className="auth-login-band" aria-hidden />
      <header className="auth-topbar">
        {onBack ? (
          <button type="button" onClick={onBack} className="auth-back" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="auth-back-spacer" aria-hidden />
        )}
        <div className="auth-topbar-lockup">
          <div className="auth-topbar-logo">
            <span className="auth-topbar-mark">
              <LuminaLogo size={18} className="text-primary" />
            </span>
            <span>{brand.name}</span>
          </div>
          <span className="auth-login-badge">{auth.badge}</span>
        </div>
        <span className="auth-back-spacer" aria-hidden />
      </header>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card-centered auth-card-login"
      >
        {(title || subtitle) && (
          <div className="auth-card-head">
            {title && <h1 className="auth-card-title">{title}</h1>}
            {subtitle && <p className="auth-card-sub">{subtitle}</p>}
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}