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

/**
 * Apple "Designing Fluid Interfaces" spring vocabulary (damping ratio +
 * response, mapped to Motion's bounce/duration spring API). Default to the
 * critically damped preset for anything that isn't a direct, momentum-carrying
 * gesture (flick/drag release) — overshoot on a scroll reveal reads as noise,
 * not delight.
 */
export const SPRING = {
  /** Critically damped (damping 1.0) — the house default for reveals,
   * entrances, and hover/press feedback. Settles smoothly, no bounce. */
  critical: { type: "spring", bounce: 0, duration: 0.5 },
  /** Slightly snappier critically damped spring for micro-interactions
   * (button press, hover lift) where response should read as instant. */
  snappy: { type: "spring", bounce: 0, duration: 0.3 },
  /** Under-damped (damping ~0.8) — reserve for elements that carry visible
   * momentum into their resting state (e.g. a card settling after a flick). */
  momentum: { type: "spring", bounce: 0.22, duration: 0.5 },
} as const satisfies Record<string, Transition>;

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

/** Fade + slide-up + subtle scale so content "materializes" into place
 * rather than just fading in (apple-design §12: animate blur/scale together
 * so a surface reads as arriving, not merely appearing). Spring-driven —
 * critically damped, no overshoot — for a more organic settle than a fixed
 * cubic-bezier curve. */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRING.critical },
};

/** Stagger container: reveals each child in sequence rather than all at
 * once — apply to a parent alongside `fadeUpVariants` on each child. */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

/** Larger materialize reveal for hero-weight visuals (phone mockups,
 * feature spotlights) — more pronounced scale + y than `fadeUpVariants`. */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRING.critical },
};

/** Hover/press feedback for interactive surfaces (cards, CTAs). Feedback
 * fires on press-down via `whileTap`, never only on release (apple-design
 * §1). Spread onto a `motion.*` element as `{...hoverLift}`. */
export const hoverLift = {
  whileHover: { y: -3, transition: SPRING.snappy },
  whileTap: { scale: 0.97, transition: SPRING.snappy },
} as const;

/** Route-level enter transition for `app/template.tsx`. Deliberately
 * subtler and snappier than `fadeUpVariants` (small 8px offset, base
 * duration) since it fires on every navigation rather than once on
 * scroll — should read as a quick settle, not a scroll reveal. */
export const pageEnterVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.inOutSmooth },
  },
};
