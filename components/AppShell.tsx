"use client";

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

type AppShellProps = {
  hero?: React.ReactNode;
  floating?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sheetClassName?: string;
  compactHero?: boolean;
};

export default function AppShell({
  hero,
  floating,
  children,
  className = "",
  sheetClassName = "",
  compactHero = false,
}: AppShellProps) {
  return (
    <div className={`page-canvas ${className}`}>
      {hero && (
        <div className={`hero-zone ${compactHero ? "hero-zone-compact" : ""}`}>
          {hero}
        </div>
      )}
      {floating && (
        <div className="floating-slot">
          <div className="content-wrap">{floating}</div>
        </div>
      )}
      <motion.main
        variants={pageEnter}
        initial="hidden"
        animate="show"
        className={`page-sheet ${hero ? (floating ? "page-sheet-float" : "page-sheet-overlap") : ""} ${sheetClassName}`}
      >
        <div className="content-wrap">{children}</div>
      </motion.main>
    </div>
  );
}