"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { popIn } from "@/lib/motion";

type SavedToastProps = {
  message: string;
  visible: boolean;
};

export default function SavedToast({ message, visible }: SavedToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          variants={popIn}
          initial="hidden"
          animate="show"
          exit="exit"
          className="saved-toast"
        >
          <Check size={14} />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}