"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Max vertical drift in px as the element crosses the viewport. Positive
   * values drift the element down as the page scrolls up past it (a subtle
   * "depth" cue), negative values drift it up faster than scroll (float). */
  distance?: number;
}

/**
 * Scroll-linked depth effect for hero/spotlight visuals — the element drifts
 * a few px against normal scroll as it moves through the viewport, reading
 * as a layer with its own depth rather than content pinned flat to the page.
 * Uses `useScroll`/`useTransform` (not `whileInView`) so motion is driven
 * continuously by scroll position, not a one-shot trigger. No-ops under
 * `prefers-reduced-motion` — apple-design §14 treats large moving surfaces
 * as a vestibular risk, so reduced motion gets a static layer instead.
 */
export function Parallax({ children, className, distance = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <motion.div ref={ref} className={className} style={prefersReducedMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
