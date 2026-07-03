"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X } from "lucide-react";
import { useState, useEffect } from "react";

interface BiometricPromptProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  amount?: string;
  recipient?: string;
}

export default function BiometricPrompt({
  isOpen,
  onConfirm,
  onCancel,
  amount,
  recipient,
}: BiometricPromptProps) {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanning(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleScan = () => {
    setScanning(true);
    // Simulate biometric scan
    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      setTimeout(() => {
        onConfirm();
      }, 800);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-t-3xl glass p-6 pb-10"
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-surface-500" />
            </div>

            {/* Close */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-600 transition-colors"
            >
              <X size={18} className="text-text-tertiary" />
            </button>

            {/* Content */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-text-primary">
                Confirm Transfer
              </h3>

              {amount && recipient && (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-brand-300">{amount}</p>
                  <p className="text-sm text-text-secondary">to {recipient}</p>
                </div>
              )}

              {/* Biometric Button */}
              <button
                onClick={handleScan}
                disabled={scanning || success}
                className="relative mx-auto flex items-center justify-center w-20 h-20 rounded-full transition-all"
              >
                {/* Pulse rings */}
                {scanning && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-brand-400"
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-brand-400"
                      animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </>
                )}

                {/* Icon background */}
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                    success
                      ? "bg-accent-mint/20"
                      : scanning
                        ? "bg-brand-500/20"
                        : "bg-brand-500/15 hover:bg-brand-500/25 active:scale-95"
                  }`}
                >
                  {success ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="text-accent-mint"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  ) : (
                    <Fingerprint
                      size={32}
                      className={`transition-colors ${
                        scanning ? "text-brand-400" : "text-brand-300"
                      }`}
                    />
                  )}
                </div>
              </button>

              <p className="text-xs text-text-tertiary">
                {success
                  ? "Verified! Processing transfer..."
                  : scanning
                    ? "Scanning..."
                    : "Tap fingerprint to confirm"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
