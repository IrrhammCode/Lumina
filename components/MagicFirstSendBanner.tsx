"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { magicFirstSend } from "@/lib/copy";

const DISMISS_KEY = "lumina:magic-first-send-dismissed";

type MagicFirstSendBannerProps = {
  paymentCount: number;
};

export default function MagicFirstSendBanner({ paymentCount }: MagicFirstSendBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });

  if (dismissed || paymentCount > 0) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="magic-first-send"
      >
        <div className="magic-first-send-icon">
          <Sparkles size={18} />
        </div>
        <div className="magic-first-send-text">
          <p className="magic-first-send-title">{magicFirstSend.title}</p>
          <p className="magic-first-send-sub">{magicFirstSend.sub}</p>
        </div>
        <button
          type="button"
          className="magic-first-send-cta"
          onClick={() => router.push("/pay?amount=20&need=pulsa")}
        >
          {magicFirstSend.cta}
        </button>
        <button type="button" onClick={dismiss} className="magic-first-send-close" aria-label="Dismiss">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}