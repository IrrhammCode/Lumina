"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wallet, X } from "lucide-react";
import { consumeMagicMoment, dismissMagicMoment } from "@/lib/magic-moment";
import { useMagicWallet } from "@/app/providers/MagicWalletProvider";
import { shortAddress } from "@/lib/format";
import { magicMoment } from "@/lib/copy";
import { sheetBackdrop, sheetPanel, springSnappy } from "@/lib/motion";

type MagicMomentProps = {
  ready: boolean;
};

export default function MagicMoment({ ready }: MagicMomentProps) {
  const { address, isMagicMode } = useMagicWallet();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || !isMagicMode) return;
    if (consumeMagicMoment()) setOpen(true);
  }, [ready, isMagicMode]);

  const dismiss = () => {
    dismissMagicMoment();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="magic-moment-backdrop"
            variants={sheetBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={dismiss}
          />
          <motion.div
            className="magic-moment-panel"
            variants={sheetPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springSnappy}
            role="dialog"
            aria-labelledby="magic-moment-title"
          >
            <button type="button" className="magic-moment-close" onClick={dismiss} aria-label="Close">
              <X size={18} />
            </button>

            <div className="magic-moment-glow" aria-hidden>
              <Sparkles size={28} className="text-glow" />
            </div>

            <h2 id="magic-moment-title" className="magic-moment-title">
              {magicMoment.title}
            </h2>
            <p className="magic-moment-sub">{magicMoment.sub}</p>

            <div className="magic-moment-wallet">
              <span className="magic-moment-wallet-icon">
                <Wallet size={18} />
              </span>
              <div>
                <p className="magic-moment-wallet-label">{magicMoment.careId}</p>
                <p className="magic-moment-wallet-addr">
                  {address ? shortAddress(address) : magicMoment.pending}
                </p>
              </div>
            </div>

            <ul className="magic-moment-perks">
              {magicMoment.perks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <button type="button" onClick={dismiss} className="btn-primary w-full">
              {magicMoment.cta}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}