"use client";

import { motion } from "framer-motion";

// ============================================
// SPINNER LOADER
// ============================================

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const spinnerSizes = {
  sm: 16,
  md: 24,
  lg: 40,
};

export const Spinner = ({ size = "md", color = "var(--color-primary)", className = "" }: SpinnerProps) => {
  const sizeValue = spinnerSizes[size];

  return (
    <motion.svg
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity={0.2} />
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="16"
      />
    </motion.svg>
  );
};

// ============================================
// DOTS LOADER
// ============================================

interface DotsLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const dotSizes = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const DotsLoader = ({ size = "md", color = "var(--color-primary)", className = "" }: DotsLoaderProps) => {
  const dotSize = dotSizes[size];

  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// PULSE LOADER
// ============================================

interface PulseLoaderProps {
  size?: number;
  color?: string;
  className?: string;
}

export const PulseLoader = ({ size = 40, color = "var(--color-primary)", className = "" }: PulseLoaderProps) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{
            scale: [1, 2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      ))}
      <span
        style={{
          position: "absolute",
          inset: "25%",
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </div>
  );
};

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  animated?: boolean;
  className?: string;
}

const progressSizes = {
  sm: 4,
  md: 8,
  lg: 12,
};

export const ProgressBar = ({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  color = "var(--color-primary)",
  animated = true,
  className = "",
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const height = progressSizes[size];

  return (
    <div className={className}>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height,
          backgroundColor: "var(--surface-muted)",
        }}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          {/* Shimmer effect */}
          {animated && (
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              }}
            />
          )}
        </motion.div>
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {value} / {max}
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--color-charcoal)" }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// CIRCULAR PROGRESS
// ============================================

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  color?: string;
  className?: string;
}

export const CircularProgress = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  color = "var(--color-primary)",
  className = "",
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-bold"
            style={{ color: "var(--color-charcoal)" }}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
    </div>
  );
};

// ============================================
// SKELETON SHIMMER
// ============================================

export const ShimmerEffect = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className={`absolute inset-0 ${className}`}
      style={{
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      }}
    />
  );
};

// ============================================
// FULL PAGE LOADER
// ============================================

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader = ({ message = "Loading..." }: FullPageLoaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mb-4"
      >
        <PulseLoader size={60} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium"
        style={{ color: "var(--color-text-muted)" }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

// ============================================
// INLINE LOADER
// ============================================

interface InlineLoaderProps {
  text?: string;
  className?: string;
}

export const InlineLoader = ({ text = "Loading", className = "" }: InlineLoaderProps) => {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size="sm" />
      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {text}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ...
        </motion.span>
      </span>
    </span>
  );
};
