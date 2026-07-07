"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X, Check, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { sheetBackdrop, sheetPanel, springSnappy } from "@/lib/motion";
import { bio } from "@/lib/copy";
import { getPrefs } from "@/lib/prefs";
import { hasParticleConfig } from "@/lib/particle-config";
import { hasMagicConfig } from "@/lib/magic-config";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { Sparkles } from "lucide-react";
import {
  authenticatePasskey,
  detectBiometricLabel,
  getLocalPasskeyEnrolled,
  isPlatformBiometricAvailable,
  type BiometricPurpose,
} from "@/lib/webauthn-client";

type BiometricContext = "approve" | "activate" | "pay" | "default";

interface BiometricPromptProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  amount?: string;
  recipient?: string;
  context?: BiometricContext;
}

const CONTEXT_COPY = {
  approve: bio.approve,
  activate: bio.activate,
  pay: bio.pay,
  default: bio.default,
};

const CONTEXT_PURPOSE: Record<BiometricContext, BiometricPurpose> = {
  approve: "approve",
  activate: "activate",
  pay: "pay",
  default: "default",
};

export default function BiometricPrompt({
  isOpen,
  onConfirm,
  onCancel,
  amount,
  recipient,
  context = "default",
}: BiometricPromptProps) {
  const copy = CONTEXT_COPY[context];
  const purpose = CONTEXT_PURPOSE[context];
  const { isUaMode, isMagicMode } = useLuminaUA();
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const attemptedRef = useRef(false);
  const label = detectBiometricLabel();

  const biometricEnabled = isOpen ? getPrefs().biometricEnabled : true;
  const settlementHint = isMagicMode
    ? bio.magicHint
    : hasParticleConfig() && isUaMode
      ? bio.uaHint
      : hasMagicConfig()
        ? bio.magicHint
        : undefined;

  const confirmSuccess = useCallback(() => {
    setSuccess(true);
    setTimeout(() => onConfirm(), 550);
  }, [onConfirm]);

  const runVerification = useCallback(async () => {
    if (scanning || success) return;
    setScanning(true);
    setError(null);

    const enrolled = getLocalPasskeyEnrolled();
    const platformAvailable = await isPlatformBiometricAvailable();

    if (!enrolled || !platformAvailable || useFallback) {
      setScanning(false);
      setUseFallback(true);
      return;
    }

    const result = await authenticatePasskey(purpose);
    setScanning(false);

    if (result.ok) {
      confirmSuccess();
      return;
    }

    setError(result.error);
    setUseFallback(true);
  }, [scanning, success, useFallback, purpose, confirmSuccess]);

  useEffect(() => {
    if (!isOpen) {
      attemptedRef.current = false;
      return;
    }
    if (!getPrefs().biometricEnabled) {
      onConfirm();
      return;
    }
    setScanning(false);
    setSuccess(false);
    setError(null);
    setUseFallback(false);
    attemptedRef.current = false;
  }, [isOpen, onConfirm]);

  useEffect(() => {
    if (!isOpen || !biometricEnabled || attemptedRef.current) return;
    attemptedRef.current = true;
    const t = setTimeout(() => void runVerification(), 350);
    return () => clearTimeout(t);
  }, [isOpen, biometricEnabled, runVerification]);

  const handleFallbackTap = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      confirmSuccess();
    }, 800);
  };

  const title = copy.title.replace("Face ID", label);

  return (
    <AnimatePresence>
      {isOpen && biometricEnabled && (
        <motion.div
          variants={sheetBackdrop}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 backdrop-blur-[2px]"
          onClick={onCancel}
        >
          <motion.div
            variants={sheetPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bio-sheet w-full max-w-lg card rounded-b-none rounded-t-xl pb-10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4 pt-2">
              <div className="w-10 h-1 rounded-pill bg-border-soft" />
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="text-mute" />
            </motion.button>

            <div className="text-center space-y-4 px-6">
              {isMagicMode && (
                <span className="bio-magic-badge">
                  <Sparkles size={12} aria-hidden />
                  {bio.magicBadge}
                </span>
              )}
              <h3 className="text-title text-lg">{title}</h3>
              {amount && recipient && (
                <div>
                  <p className="text-amount text-3xl">{amount}</p>
                  <p className="text-caption">→ {recipient}</p>
                </div>
              )}

              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                {scanning && (
                  <>
                    <motion.span className="bio-ring bio-ring-1" animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }} />
                    <motion.span className="bio-ring bio-ring-2" animate={{ scale: [1, 1.5], opacity: [0.4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.35 }} />
                  </>
                )}
                <motion.button
                  onClick={useFallback ? handleFallbackTap : () => void runVerification()}
                  disabled={scanning || success}
                  whileTap={{ scale: 0.94 }}
                  animate={{
                    scale: success ? 1.05 : scanning ? 0.96 : 1,
                    backgroundColor: success ? "var(--color-positive)" : "var(--color-primary)",
                  }}
                  transition={springSnappy}
                  className="relative z-[1] w-16 h-16 rounded-full flex items-center justify-center text-on-primary"
                  aria-label="Confirm"
                >
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springSnappy}>
                        <Check size={28} strokeWidth={3} />
                      </motion.span>
                    ) : error ? (
                      <motion.span key="error" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springSnappy}>
                        <AlertCircle size={26} />
                      </motion.span>
                    ) : (
                      <motion.span key="finger" animate={scanning ? { opacity: [1, 0.5, 1] } : { opacity: 1 }} transition={{ duration: 0.8, repeat: scanning ? Infinity : 0 }}>
                        <Fingerprint size={28} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {settlementHint && !success && (
                <p className="text-caption text-xs bio-settlement-hint">{settlementHint}</p>
              )}
              <p className="text-caption text-sm">
                {success
                  ? copy.success
                  : scanning
                    ? bio.verifying(label)
                    : error
                      ? bio.error
                      : useFallback
                        ? bio.fallback
                        : bio.tapBiometric(label)}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}