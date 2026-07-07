"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Fingerprint, Loader2, AlertCircle } from "lucide-react";
import { onboarding } from "@/lib/copy";
import { fadeScale, springSnappy } from "@/lib/motion";
import { setBiometricUnlocked } from "@/lib/biometric-unlock";
import {
  detectBiometricLabel,
  getLocalPasskeyEnrolled,
  isPlatformBiometricAvailable,
  isWebAuthnSupported,
  registerPasskey,
  syncPasskeyStatus,
} from "@/lib/webauthn-client";

type Status = "checking" | "unavailable" | "ready" | "enrolling" | "done" | "error";

type OnboardingBiometricStepProps = {
  onEnrolled: () => void;
  onSkipped: () => void;
};

export default function OnboardingBiometricStep({ onEnrolled, onSkipped }: OnboardingBiometricStepProps) {
  const label = detectBiometricLabel();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  const enroll = useCallback(async () => {
    setStatus("enrolling");
    setError(null);
    const result = await registerPasskey(label);
    if (result.ok) {
      setBiometricUnlocked();
      setStatus("done");
      onEnrolled();
      return;
    }
    setError(result.error);
    setStatus("error");
  }, [label, onEnrolled]);

  useEffect(() => {
    void (async () => {
      await syncPasskeyStatus();
      if (getLocalPasskeyEnrolled()) {
        setStatus("done");
        onEnrolled();
        return;
      }
      if (!isWebAuthnSupported() || !(await isPlatformBiometricAvailable())) {
        setStatus("unavailable");
        onSkipped();
        return;
      }
      setStatus("ready");
    })();
  }, [onEnrolled, onSkipped]);

  useEffect(() => {
    if (status !== "ready" || attemptedRef.current) return;
    attemptedRef.current = true;
    const t = setTimeout(() => void enroll(), 700);
    return () => clearTimeout(t);
  }, [status, enroll]);

  if (status === "checking") {
    return (
      <div className="onboard-wallet-waiting">
        <Loader2 size={28} className="animate-spin text-glow" />
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <motion.div variants={fadeScale} initial="initial" animate="animate" className="onboard-bio-step">
        <p className="onboard-bio-hint text-center">{onboarding.biometricUnavailable}</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeScale} initial="initial" animate="animate" className="onboard-bio-step">
      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
        {(status === "enrolling" || status === "ready") && (
          <>
            <motion.span
              className="bio-ring bio-ring-1"
              animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="bio-ring bio-ring-2"
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
            />
          </>
        )}
        <motion.div
          animate={{
            scale: status === "done" ? 1.05 : 1,
            backgroundColor: status === "done" ? "var(--color-positive)" : "var(--color-primary)",
          }}
          transition={springSnappy}
          className="relative z-[1] w-20 h-20 rounded-full flex items-center justify-center text-on-primary"
        >
          {status === "done" ? (
            <Check size={32} strokeWidth={3} />
          ) : status === "enrolling" ? (
            <Loader2 size={30} className="animate-spin" />
          ) : status === "error" ? (
            <AlertCircle size={28} />
          ) : (
            <Fingerprint size={30} />
          )}
        </motion.div>
      </div>

      <p className="onboard-bio-headline text-center">
        {status === "done"
          ? onboarding.biometricDone(label)
          : status === "enrolling"
            ? onboarding.biometricEnrolling
            : onboarding.biometricTitle(label)}
      </p>
      <p className="onboard-bio-hint text-center">
        {status === "done" ? onboarding.biometricDoneSub : onboarding.biometricSub}
      </p>

      {error && <p className="onboard-bio-error text-center">{error}</p>}

      {status === "error" && (
        <div className="onboard-bio-actions">
          <button type="button" onClick={() => void enroll()} className="btn-primary w-full">
            {onboarding.biometricCta(label)}
          </button>
        </div>
      )}

      {status !== "done" && (
        <button type="button" onClick={onSkipped} className="btn-ghost text-caption text-sm w-full mt-2">
          {onboarding.biometricSkip}
        </button>
      )}
    </motion.div>
  );
}