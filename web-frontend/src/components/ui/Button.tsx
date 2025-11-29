"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ButtonHTMLAttributes, type ReactNode, useState, useRef } from "react";

// ============================================
// RIPPLE EFFECT COMPONENT
// ============================================

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

const Ripple = ({ x, y, size }: RippleProps) => {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 4, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "currentColor",
        pointerEvents: "none",
      }}
    />
  );
};

// ============================================
// LOADING SPINNER
// ============================================

const LoadingSpinner = ({ size = 20 }: { size?: number }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="32"
        opacity={0.25}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="16"
      />
    </motion.svg>
  );
};

// ============================================
// ANIMATED BUTTON COMPONENT
// ============================================

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AnimatedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantStyles: Record<ButtonVariant, { base: string; hover: string }> = {
  primary: {
    base: "bg-[var(--color-plum)] text-white shadow-lg",
    hover: "shadow-xl",
  },
  secondary: {
    base: "bg-[var(--color-peach)] text-[var(--color-plum)]",
    hover: "shadow-md",
  },
  outline: {
    base: "border-2 border-[var(--color-plum)] text-[var(--color-plum)] bg-transparent",
    hover: "bg-[var(--color-plum)]/5",
  },
  ghost: {
    base: "text-[var(--color-plum)] bg-transparent",
    hover: "bg-[var(--color-plum)]/10",
  },
  danger: {
    base: "bg-[var(--color-error)] text-white",
    hover: "shadow-lg",
  },
};

export const AnimatedButton = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled,
  onClick,
  className = "",
  ...props
}: AnimatedButtonProps) => {
  const [ripples, setRipples] = useState<Array<RippleProps & { id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 0.5;

      const newRipple = { x, y, size, id: rippleIdRef.current++ };
      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  };

  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={buttonRef}
      whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        relative overflow-hidden rounded-full font-semibold uppercase tracking-wide
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-plum)]/50 focus:ring-offset-2
        ${sizeStyles[size]}
        ${styles.base}
        ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Ripple container */}
      <span className="absolute inset-0 overflow-hidden rounded-full opacity-20">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <Ripple key={ripple.id} x={ripple.x} y={ripple.y} size={ripple.size} />
          ))}
        </AnimatePresence>
      </span>

      {/* Button content */}
      <span className="relative flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <LoadingSpinner size={size === "sm" ? 14 : size === "lg" ? 22 : 18} />
            </motion.span>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {icon && iconPosition === "left" && <span>{icon}</span>}
              {children}
              {icon && iconPosition === "right" && <span>{icon}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
};

// ============================================
// ICON BUTTON
// ============================================

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export const IconButton = ({
  children,
  variant = "ghost",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: IconButtonProps) => {
  const isDisabled = disabled || loading;
  const styles = variantStyles[variant];

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.1 }}
      whileTap={isDisabled ? {} : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={isDisabled}
      className={`
        relative overflow-hidden rounded-full
        flex items-center justify-center
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-plum)]/50
        ${iconSizeStyles[size]}
        ${styles.base}
        ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${className}
      `}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
          >
            <LoadingSpinner size={size === "sm" ? 14 : size === "lg" ? 22 : 18} />
          </motion.span>
        ) : (
          <motion.span
            key="icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
