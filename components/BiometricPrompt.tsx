"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { sheetBackdrop, sheetPanel, springSnappy, tweenBase } from "@/lib/motion";
import { bio } from "@/lib/copy";
import { getPrefs } from "@/lib/prefs";
import { hasParticleConfig } from "@/lib/particle-config";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";

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

export default function BiometricPrompt({
  isOpen,
  onConfirm,
  onCancel,
  amount,
  recipient,
  context = "default",
}: BiometricPromptProps) {
  const copy = CONTEXT_COPY[context];
  const { isUaMode } = useLuminaUA();
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  const biometricEnabled = isOpen ? getPrefs().biometricEnabled : true;
  const settlementHint = hasParticleConfig()
    ? isUaMode
      ? bio.uaHint
      : bio.demoHint
    : undefined;

  useEffect(() => {
    if (!isOpen) return;
    if (!getPrefs().biometricEnabled) {
      onConfirm();
      return;
    }
    setScanning(false);
    setSuccess(false);
  }, [isOpen]);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      setTimeout(() => onConfirm(), 550);
    }, 1200);
  };

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
              <h3 className="text-title text-lg">{copy.title}</h3>
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
                  onClick={handleScan}
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
                {success ? copy.success : scanning ? bio.scanning : bio.tap}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}