"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { NEED_META, type PaymentRecord } from "@/lib/allowances";
import { sheetBackdrop, sheetPanel, staggerContainer, staggerItem, tweenBase } from "@/lib/motion";
import { receipt } from "@/lib/copy";
import { getCountryMeta } from "@/lib/countries";
import SettlementProof from "@/components/SettlementProof";
import IpfsGraphProof from "@/components/IpfsGraphProof";
import { getGraphMeta, subscribeGraphMeta } from "@/lib/graph-meta";

type ReceiptSheetProps = {
  payment: PaymentRecord | null;
  onClose: () => void;
};

export default function ReceiptSheet({ payment, onClose }: ReceiptSheetProps) {
  const [hasGraphProof, setHasGraphProof] = useState(false);

  useEffect(() => {
    const refresh = () => setHasGraphProof(Boolean(getGraphMeta()));
    refresh();
    return subscribeGraphMeta(refresh);
  }, []);

  const meta = payment ? NEED_META[payment.needType] : null;
  const dateStr = payment
    ? new Date(payment.date).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "";

  const typeLabel = receipt.types;

  return (
    <AnimatePresence>
      {payment && meta && (
        <motion.div variants={sheetBackdrop} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 backdrop-blur-[2px]" onClick={onClose}>
          <motion.div variants={sheetPanel} initial="hidden" animate="show" exit="exit" className="receipt-sheet w-full max-w-lg card rounded-b-none rounded-t-xl pb-10 relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4 pt-2"><div className="w-10 h-1 rounded-pill bg-border-soft" /></div>
            <motion.button whileTap={{ scale: 0.92 }} type="button" onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">
              <X size={20} className="text-mute" />
            </motion.button>

            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="px-6 space-y-5">
              <motion.div variants={staggerItem} className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.1 }} className="w-14 h-14 rounded-full bg-positive text-canvas flex items-center justify-center mx-auto mb-3">
                  <Check size={28} strokeWidth={3} />
                </motion.div>
                <h3 className="text-title text-lg">{receipt.title}</h3>
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...tweenBase, delay: 0.15 }} className="text-amount text-3xl mt-2">−${payment.amount.toFixed(2)}</motion.p>
                <p className="text-caption text-sm mt-1">{dateStr}</p>
              </motion.div>

              <motion.div variants={staggerItem} className="receipt-detail-card space-y-3">
                <Row label={receipt.to} value={`${getCountryMeta(payment.countryCode).name} · ${payment.memberName}`} />
                <Row label={receipt.for} value={payment.ruleLabel ?? meta.label} />
                <Row label={receipt.type} value={typeLabel[payment.type]} badge={payment.type} />
                <Row label={receipt.status} value={receipt.completed} positive />
                <Row label={receipt.fee} value={receipt.free} positive />
              </motion.div>

              {payment.settlementRef && (
                <motion.div variants={staggerItem}>
                  <SettlementProof payment={payment} />
                </motion.div>
              )}

              {hasGraphProof && (
                <motion.div variants={staggerItem} className="proof-loop proof-loop--ipfs">
                  <p className="text-xs font-bold uppercase tracking-wider text-mute mb-2">{receipt.graphProof}</p>
                  <IpfsGraphProof variant="compact" />
                </motion.div>
              )}

              <motion.div variants={staggerItem}>
                <motion.button type="button" onClick={onClose} whileTap={{ scale: 0.98 }} className="btn-secondary w-full">{receipt.close}</motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, positive, badge }: { label: string; value: string; positive?: boolean; badge?: "auto" | "manual" | "pull" }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-caption text-sm">{label}</span>
      <span className="flex items-center gap-1.5">
        {badge === "auto" && <span className="badge-auto">Auto</span>}
        {badge === "pull" && <span className="badge-pull">Pull</span>}
        <span className={`text-sm font-semibold ${positive ? "text-positive" : "text-ink"}`}>{value}</span>
      </span>
    </div>
  );
}