import type { Transition, Variants } from "framer-motion";

export const EASE_LUMINA = [0.22, 1, 0.36, 1] as const;

export const springSnappy = { type: "spring" as const, stiffness: 420, damping: 32 };
export const springGentle = { type: "spring" as const, stiffness: 280, damping: 28 };
export const springSheet = { type: "spring" as const, stiffness: 340, damping: 36 };

export const tweenFast: Transition = { duration: 0.2, ease: EASE_LUMINA };
export const tweenBase: Transition = { duration: 0.32, ease: EASE_LUMINA };
export const tweenSlow: Transition = { duration: 0.45, ease: EASE_LUMINA };

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ...tweenBase, staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const pageItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: tweenBase },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: tweenBase },
  exit: { opacity: 0, y: -8, transition: tweenFast },
};

export const slideForward: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: tweenBase },
  exit: { opacity: 0, x: -20, transition: tweenFast },
};

export const slideBack: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: tweenBase },
  exit: { opacity: 0, x: 20, transition: tweenFast },
};

export const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: springGentle },
  exit: { opacity: 0, scale: 0.96, transition: tweenFast },
};

export const sheetBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: tweenFast },
  exit: { opacity: 0, transition: tweenFast },
};

export const sheetPanel: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: springSheet },
  exit: { y: "100%", transition: { ...tweenBase, duration: 0.28 } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, scale: 0.9, y: -4, transition: tweenFast },
};

export const tapScale = { whileTap: { scale: 0.97 }, transition: springSnappy };
export const tapScaleSoft = { whileTap: { scale: 0.985 }, transition: springSnappy };