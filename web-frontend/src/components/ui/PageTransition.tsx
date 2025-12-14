"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ReactNode } from "react";

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const slideVariants = {
  initial: {
    opacity: 0,
    x: 60,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: {
      duration: 0.3,
    },
  },
};

const fadeVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const scaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  enter: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } },
};

const variantMap = {
  slide: pageVariants,
  slideHorizontal: slideVariants,
  fade: fadeVariants,
  scale: scaleVariants,
};

// ============================================
// PAGE TRANSITION WRAPPER
// ============================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variantMap;
}

export const PageTransitionWrapper = ({
  children,
  className = "",
  variant = "slide",
}: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={variantMap[variant]}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// ANIMATED PAGE CONTAINER
// ============================================

interface AnimatedPageProps {
  children: ReactNode;
  pageKey: string;
  className?: string;
  variant?: keyof typeof variantMap;
}

export const AnimatedPage = ({ children, pageKey, className = "", variant = "slide" }: AnimatedPageProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variantMap[variant]}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// SECTION REVEAL ANIMATION
// ============================================

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const directionOffsets = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { y: 0, x: 40 },
  right: { y: 0, x: -40 },
};

export const SectionReveal = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: SectionRevealProps) => {
  const offset = directionOffsets[direction];

  return (
    <motion.section
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// ============================================
// CONTENT FADE IN
// ============================================

interface ContentFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const ContentFade = ({ children, className = "", delay = 0, duration = 0.5 }: ContentFadeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================

import { useScroll, useSpring } from "framer-motion";

export const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--color-primary)",
        transformOrigin: "0%",
        zIndex: 100,
      }}
    />
  );
};

// ============================================
// PARALLAX SECTION
// ============================================

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export const ParallaxSection = ({ children, className = "", offset = 50 }: ParallaxSectionProps) => {
  const { scrollYProgress } = useScroll();
  const y = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      style={{ y: y.get() * offset }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
