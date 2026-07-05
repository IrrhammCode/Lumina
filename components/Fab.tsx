"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

type FabProps = {
  label: string;
  onClick: () => void;
};

export default function Fab({ label, onClick }: FabProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="fab"
      aria-label={label}
    >
      <Plus size={22} strokeWidth={2.5} />
      <span className="fab-label">{label}</span>
    </motion.button>
  );
}