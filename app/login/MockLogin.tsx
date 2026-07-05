"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { getPostLoginPath } from "@/lib/auth";
import { slideBack, slideForward } from "@/lib/motion";
import { auth, actions } from "@/lib/copy";

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
    await new Promise((r) => setTimeout(r, 1200));
    setStep("otp");
    setIsLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    if (next.every((d) => d !== "")) handleOtpVerify();
  };

  const handleOtpVerify = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    localStorage.setItem("lumina_user", JSON.stringify({ email, loggedIn: true }));
    router.replace(getPostLoginPath());
    setIsLoading(false);
  };

  const handleSocial = async (provider: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    localStorage.setItem("lumina_user", JSON.stringify({ email: `user@${provider}.com`, loggedIn: true }));
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
            <p className="auth-terms">{auth.terms}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}