"use client";

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

export default function PageEnter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={pageEnter}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}