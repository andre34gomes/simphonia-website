"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { pageEnterVariants } from "@/lib/motion";

/**
 * Next.js remounts `template.tsx` on every navigation (unlike `layout.tsx`,
 * which persists across routes), making it the standard low-risk hook for a
 * per-route enter transition. `MotionConfig reducedMotion="user"` (set at
 * the app root) automatically disables this for users with
 * `prefers-reduced-motion` — no extra check needed here.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={pageEnterVariants}>
      {children}
    </motion.div>
  );
}
