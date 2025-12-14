"use client";

import { motion, type Variants, type Transition } from "framer-motion";
import { type ReactNode, type ComponentProps } from "react";

// ============================================
// ANIMATION VARIANTS
// ============================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

// Stagger container for child animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  type: "tween",
  duration: 0.3,
  ease: "easeOut",
};

export const bounceTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
};

// ============================================
// ANIMATED WRAPPER COMPONENTS
// ============================================

type MotionDivProps = ComponentProps<typeof motion.div>;

interface AnimatedContainerProps extends Omit<MotionDivProps, "variants"> {
  children: ReactNode;
  delay?: number;
  variant?: "fadeInUp" | "fadeInDown" | "fadeIn" | "scaleIn" | "slideInFromBottom" | "fadeInLeft" | "fadeInRight";
}

const variantMap: Record<NonNullable<AnimatedContainerProps["variant"]>, Variants> = {
  fadeInUp,
  fadeInDown,
  fadeIn,
  scaleIn,
  slideInFromBottom,
  fadeInLeft,
  fadeInRight,
};

export const AnimatedContainer = ({
  children,
  delay = 0,
  variant = "fadeInUp",
  className,
  ...props
}: AnimatedContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variantMap[variant]}
      transition={{ ...smoothTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered list container
interface StaggeredListProps extends Omit<MotionDivProps, "variants"> {
  children: ReactNode;
  fast?: boolean;
}

export const StaggeredList = ({ children, fast = false, className, ...props }: StaggeredListProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fast ? staggerContainerFast : staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered list item
interface StaggeredItemProps extends Omit<MotionDivProps, "variants"> {
  children: ReactNode;
}

export const StaggeredItem = ({ children, className, ...props }: StaggeredItemProps) => {
  return (
    <motion.div variants={fadeInUp} className={className} {...props}>
      {children}
    </motion.div>
  );
};

// Hover scale wrapper
interface HoverScaleProps extends Omit<MotionDivProps, "whileHover" | "whileTap"> {
  children: ReactNode;
  scale?: number;
  tapScale?: number;
}

export const HoverScale = ({ children, scale = 1.02, tapScale = 0.98, className, ...props }: HoverScaleProps) => {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: tapScale }}
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={smoothTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Pulse animation for notifications/badges
interface PulseProps extends Omit<MotionDivProps, "animate"> {
  children: ReactNode;
  duration?: number;
}

export const Pulse = ({ children, duration = 2, className, ...props }: PulseProps) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Shake animation for errors
interface ShakeProps extends Omit<MotionDivProps, "animate"> {
  children: ReactNode;
  trigger?: boolean;
}

export const Shake = ({ children, trigger, className, ...props }: ShakeProps) => {
  return (
    <motion.div
      animate={trigger ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
