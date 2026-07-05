"use client";

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageEnter} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}