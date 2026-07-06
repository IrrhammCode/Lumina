"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { getPostLoginPath } from "@/lib/auth";
import { slideBack, slideForward } from "@/lib/motion";
import { auth, actions } from "@/lib/copy";
import { api } from "@/lib/api-client";
import { loginAndHydrate } from "@/lib/sync";

export default function MockLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError("");
    const result = await api.sendOtp(email);
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    setStep("otp");
    setIsLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    if (next.every((d) => d !== "")) void handleOtpVerify(next.join(""));
  };

  const handleOtpVerify = async (code?: string) => {
    const otpCode = code ?? otp.join("");
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    setError("");
    const result = await api.verifyOtp(email, otpCode);
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    await loginAndHydrate(result.data.user);
    router.replace(getPostLoginPath());
    setIsLoading(false);
  };

  const handleSocial = async (provider: "google" | "apple") => {
    setIsLoading(true);
    setError("");
    const result = await api.socialLogin(provider);
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    await loginAndHydrate(result.data.user);
    router.replace(getPostLoginPath());
    setIsLoading(false);
  };

  return (
    <AuthShell
      variant="login"
      title={step === "email" ? auth.signIn : auth.otpTitle}
      subtitle={step === "email" ? auth.signInSub : auth.otpSub(email)}
      onBack={() => (step === "otp" ? setStep("email") : router.back())}
    >
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div key="email" variants={slideBack} initial="initial" animate="animate" exit="exit">
            <div className="auth-social-row">
              <button
                type="button"
                onClick={() => handleSocial("google")}
                disabled={isLoading}
                className="auth-social-btn"
              >
                {auth.google}
              </button>
              <button
                type="button"
                onClick={() => handleSocial("apple")}
                disabled={isLoading}
                className="auth-social-btn"
              >
                {auth.apple}
              </button>
            </div>
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">{auth.emailOr}</span>
              <div className="auth-divider-line" />
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="auth-field-wrap">
                <Mail size={18} className="auth-field-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={auth.emailPh}
                  className="auth-field-input"
                  required
                  disabled={isLoading}
                />
              </div>
              <button type="submit" disabled={isLoading || !email} className="btn-primary">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : actions.continue}
              </button>
            </form>
            {error && <p className="text-negative text-xs text-center mt-3">{error}</p>}
            <p className="auth-terms">{auth.terms}</p>
          </motion.div>
        ) : (
          <motion.div key="otp" variants={slideForward} initial="initial" animate="animate" exit="exit">
            <p className="auth-otp-hint">{auth.otpHint}</p>
            <div className="auth-otp-grid">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="auth-otp-cell"
                  disabled={isLoading}
                />
              ))}
            </div>
            {isLoading && (
              <div className="auth-otp-loading">
                <Loader2 className="animate-spin text-glow" />
              </div>
            )}
            {error && <p className="text-negative text-xs text-center mt-3">{error}</p>}
            <p className="auth-terms">{auth.terms}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}