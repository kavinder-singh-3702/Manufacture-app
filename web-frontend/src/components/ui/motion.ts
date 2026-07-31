"use client";

/**
 * One shared home for the fade-in-with-delay helper that used to be
 * hand-copied (as a local `fade(delay)` function) into HeroEntry,
 * OverviewSection, ServiceRequestForm, ServicesOverview, AdStudioPanel and
 * others — each with a slightly different easing/duration. Built on top of
 * the existing variants/transitions in ./animations rather than defining a
 * parallel system.
 */

import { useReducedMotion, type Variants } from "framer-motion";
import { fadeInUp, smoothTransition } from "./animations";

export const fadeInUpVariant: Variants = fadeInUp;

const EASE = [0.22, 1, 0.36, 1] as const;

/** `{...fadeUp(0.1)}` spreads straight onto a `motion.*` element. */
export const fadeUp = (delay = 0, distance = 20) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: EASE },
});

export const fadeUpTransition = (delay = 0) => ({ ...smoothTransition, delay });

/**
 * Wraps framer-motion's `useReducedMotion` so every animated component opts
 * out of decorative motion (looping gradients, autoplay video, parallax)
 * through one hook instead of each component reading matchMedia itself.
 * Returns `true` when motion is safe to run (i.e. the user has NOT asked
 * for reduced motion) — read as "is it okay to animate?".
 */
export const useMotionSafe = (): boolean => {
  const prefersReduced = useReducedMotion();
  return !prefersReduced;
};
