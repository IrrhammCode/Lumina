"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { bio } from "@/lib/copy";
import { getPrefs } from "@/lib/prefs";
import {
  detectBiometricLabel,
  getLocalPasskeyEnrolled,
  isPlatformBiometricAvailable,
  isWebAuthnSupported,
  syncPasskeyStatus,
} from "@/lib/webauthn-client";

const DISMISS_KEY = "lumina:bio-enroll-dismissed";

export default function BiometricEnrollBanner() {
  const router = useRouter();
  const label = detectBiometricLabel();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });

  useEffect(() => {
    void (async () => {
      if (dismissed || !getPrefs().biometricEnabled) return;
      if (!isWebAuthnSupported() || !(await isPlatformBiometricAvailable())) return;
      await syncPasskeyStatus();
      if (!getLocalPasskeyEnrolled()) setVisible(true);
    })();
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="magic-first-send"
      >
        <div className="magic-first-send-icon">
          <Fingerprint size={18} />
        </div>
        <div className="magic-first-send-text">
          <p className="magic-first-send-title">{bio.enrollBannerTitle(label)}</p>
          <p className="magic-first-send-sub">{bio.enrollBannerSub}</p>
        </div>
        <button
          type="button"
          className="magic-first-send-cta"
          onClick={() => router.push("/settings/security")}
        >
          {bio.enrollBannerCta}
        </button>
        <button type="button" onClick={dismiss} className="magic-first-send-dismiss" aria-label="Dismiss">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}