"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { fadeUpVariants, staggerContainerVariants, REVEAL_VIEWPORT } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds before this element's reveal starts. */
  delay?: number;
}

/**
 * Fades + slides a section into place once it scrolls into view. Intended
 * for below-the-fold marketing content only — never wrap the hero or other
 * LCP-critical, above-the-fold elements (see hero-section.tsx comments).
 * Automatically no-ops (renders instantly) when the user prefers reduced
 * motion, via the root `MotionConfig reducedMotion="user"` provider.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      variants={fadeUpVariants}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
}

/** Stagger container for a group of `RevealItem` children (e.g. a card
 * grid) — each item reveals in sequence rather than all at once. */
export function RevealGroup({ children, className }: RevealGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      variants={staggerContainerVariants}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
}

/** A single staggered child of `RevealGroup`. Inherits its "hidden"/"visible"
 * state from the parent's variants rather than its own viewport check. */
export function RevealItem({ children, className }: RevealItemProps) {
  return (
    <motion.div className={className} variants={fadeUpVariants}>
      {children}
    </motion.div>
  );
}
