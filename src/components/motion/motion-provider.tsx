"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * App-wide Motion configuration. `reducedMotion="user"` makes every Motion
 * animation (variants, transitions, layout animations, whileInView, etc.)
 * respect the OS-level `prefers-reduced-motion` setting automatically,
 * without each animated component needing its own `useReducedMotion()`
 * check. This is JS-side belt-and-suspenders alongside the CSS kill-switch
 * in globals.css (which covers Tailwind `animate-*` utility classes).
 *
 * Must be a Client Component boundary since `layout.tsx` stays a Server
 * Component (it exports `metadata`).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
