"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { pageEnterVariants } from "@/lib/motion";

/**
 * Persists across client-side navigations within the same SPA session, but
 * resets on every hard/full page load (fresh JS bundle). Only ever mutated
 * client-side (inside useEffect below), so SSR always computes `true` for
 * `skipEnterAnimation` — the hard-load path never renders at opacity 0.
 */
let hasNavigatedClientSide = false;

/**
 * Next.js remounts `template.tsx` on every navigation (unlike `layout.tsx`,
 * which persists across routes), making it the standard low-risk hook for a
 * per-route enter transition. `MotionConfig reducedMotion="user"` (set at
 * the app root) automatically disables this for users with
 * `prefers-reduced-motion` — no extra check needed here.
 *
 * On the very first mount (hard page load or first hydration), the enter
 * animation is skipped entirely: otherwise the SSR'd HTML paints with
 * opacity:0 and the browser can't register the hero's LCP image as painted
 * until JS hydrates and the fade completes, inflating LCP by ~800ms. Only
 * genuine client-side route changes (Link clicks) get the fade+slide-in.
 */
export default function Template({ children }: { children: ReactNode }) {
  const [skipEnterAnimation] = useState(() => !hasNavigatedClientSide);

  useEffect(() => {
    hasNavigatedClientSide = true;
  }, []);

  return (
    <motion.div
      initial={skipEnterAnimation ? false : "hidden"}
      animate="visible"
      variants={pageEnterVariants}
    >
      {children}
    </motion.div>
  );
}
