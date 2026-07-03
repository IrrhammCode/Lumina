"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
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

    try {
      // For demo/hackathon: simulate Magic Labs email OTP
      // In production, this calls: await loginWithEmail(email)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep("otp");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== "")) {
      handleOtpVerify(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpVerify = async (_code: string) => {
    setIsLoading(true);
    setError("");

    try {
      // For demo/hackathon: simulate OTP verification
      // In production: Magic Labs handles this automatically
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Store demo auth state
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "lumina_user",
          JSON.stringify({
            email,
            address: "0x" + "a".repeat(40),
            loggedIn: true,
          })
        );
      }

      router.push("/dashboard");
    } catch {
      setError("Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError("");

    try {
      // For demo/hackathon: simulate social login
      // In production: uses Particle ConnectKit social auth
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "lumina_user",
          JSON.stringify({
            email: `user@${provider}.com`,
            address: "0x" + "b".repeat(40),
            loggedIn: true,
          })
        );
      }

      router.push("/dashboard");
    } catch {
      setError(`Failed to login with ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col gradient-mesh">
      {/* Header */}
      <div className="flex items-center p-4">
        <button
          onClick={() => (step === "otp" ? setStep("email") : router.back())}
          className="p-2 rounded-xl hover:bg-surface-600/50 transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col"
            >
              {/* Title */}
              <div className="mb-8 mt-4">
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  Welcome to Lumina
                </h1>
                <p className="text-sm text-text-secondary">
                  Sign in or create an account to start sending money worldwide.
                </p>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl glass-light hover:bg-surface-500/50 active:scale-[0.98] transition-all font-medium text-sm text-text-primary disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin("apple")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl glass-light hover:bg-surface-500/50 active:scale-[0.98] transition-all font-medium text-sm text-text-primary disabled:opacity-50"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="currentColor"
                  >
                    <path d="M14.94 9.88c-.03-2.79 2.28-4.14 2.39-4.21-1.3-1.9-3.33-2.16-4.05-2.19-1.72-.18-3.37 1.02-4.24 1.02-.88 0-2.23-1-3.66-.97-1.88.03-3.62 1.1-4.59 2.79-1.96 3.4-.5 8.43 1.41 11.19.93 1.35 2.05 2.87 3.51 2.81 1.41-.06 1.94-.91 3.64-.91 1.7 0 2.18.91 3.67.88 1.51-.03 2.49-1.37 3.41-2.72 1.07-1.57 1.51-3.08 1.54-3.16-.03-.01-2.96-1.14-2.99-4.51l-.04-.02z" />
                    <path d="M12.14 1.95c.78-.94 1.3-2.26 1.16-3.57-1.12.05-2.48.75-3.28 1.69-.72.83-1.35 2.17-1.18 3.45 1.25.1 2.52-.64 3.3-1.57z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-surface-500" />
                <span className="text-xs text-text-tertiary">
                  or use email
                </span>
                <div className="flex-1 h-px bg-surface-500" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-surface-700/60 border border-surface-500 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3.5 rounded-2xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 btn-shine shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-accent-coral text-xs text-center mt-3"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Title */}
              <div className="mb-8 mt-4">
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  Enter verification code
                </h1>
                <p className="text-sm text-text-secondary">
                  We sent a 6-digit code to{" "}
                  <span className="text-brand-300 font-medium">{email}</span>
                </p>
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2.5 justify-center mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-surface-700/60 border border-surface-500 text-text-primary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {isLoading && (
                <div className="flex justify-center mb-4">
                  <Loader2 size={24} className="animate-spin text-brand-400" />
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-accent-coral text-xs text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <p className="text-center text-xs text-text-tertiary">
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleEmailSubmit}
                  className="text-brand-400 font-medium"
                >
                  Resend
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="py-6 text-center">
          <p className="text-xs text-text-tertiary">
            By continuing, you agree to our{" "}
            <span className="text-text-secondary">Terms of Service</span> and{" "}
            <span className="text-text-secondary">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
