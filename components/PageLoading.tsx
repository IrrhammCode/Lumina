"use client";

import { motion } from "framer-motion";
import LuminaLogo from "@/components/LuminaLogo";

export default function PageLoading() {
  return (
    <div className="page-canvas page-loading" role="status" aria-label="Loading">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="page-loading-mark"
      >
        <LuminaLogo size={28} className="text-glow" />
      </motion.div>
    </div>
  );
}