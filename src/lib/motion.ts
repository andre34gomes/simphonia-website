import { useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/**
 * Shared motion vocabulary for JS-driven (Motion) animations. Numerically
 * mirrors the CSS custom properties in `globals.css`'s `@theme` motion-system
 * block so JS and CSS transitions stay in lockstep — update both together.
 */
export const DURATION = {
  instant: 0.1,
  micro: 0.18,
  base: 0.25,
  slow: 0.4,
  reveal: 0.6,
} as const;

export const EASE = {
  standard: [0.4, 0, 0.2, 1],
  outExpo: [0.16, 1, 0.3, 1],
  inOutSmooth: [0.65, 0, 0.35, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, Transition["ease"]>;

/** Re-exported so every reduced-motion check in the app imports from one
 * place. Motion's `MotionConfig reducedMotion="user"` (set at the app root)
 * already disables JS-driven animation automatically; use this hook only
 * when a component needs to branch logic (e.g. skip a parallax effect
 * entirely) rather than just shortening a transition. */
export { useReducedMotion };

/** Scroll-into-view config shared by every reveal: fire once, slightly
 * before the element is fully in the viewport so content feels ready
 * rather than late. */
export const REVEAL_VIEWPORT = { once: true, margin: "-80px" } as const;

const revealTransition: Transition = {
  duration: DURATION.reveal,
  ease: EASE.outExpo,
};

/** Fade + slide-up variants for a single scroll-triggered reveal. */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: revealTransition },
};

/** Stagger container: reveals each child in sequence rather than all at
 * once — apply to a parent alongside `fadeUpVariants` on each child. */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};
