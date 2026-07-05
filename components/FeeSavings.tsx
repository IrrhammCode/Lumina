"use client";

import { motion, AnimatePresence } from "framer-motion";
import { competitors, getMaxCompetitorFee } from "@/lib/fees";
import { fees } from "@/lib/copy";
import { fadeScale } from "@/lib/motion";

export default function FeeSavings({ amount }: { amount: number }) {
  const show = amount > 0;
  const maxSave = getMaxCompetitorFee(amount);
  const wise = competitors.find((c) => c.name === "Wise");
  const wiseFee = wise ? Math.min(wise.fee, amount * 0.013) : 0;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="fees"
          variants={fadeScale}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fee-savings card-bordered"
        >
          <div className="fee-savings-row">
            <span className="text-sm font-semibold text-ink">{fees.luminaFee}</span>
            <span className="badge-savings">{fees.free}</span>
          </div>

          {wise && (
            <div className="fee-savings-row fee-savings-muted">
              <span>{fees.wiseCharge}</span>
              <span className="font-semibold text-body tabular-nums">${wiseFee.toFixed(2)}</span>
            </div>
          )}

          <div className="fee-savings-footer">
            <p className="text-sm font-semibold text-positive-deep">{fees.saveUpTo(maxSave)}</p>
            <p className="text-caption text-xs mt-0.5">{fees.note}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}