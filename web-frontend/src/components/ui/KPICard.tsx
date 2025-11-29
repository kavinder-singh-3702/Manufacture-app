"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { HoverScale } from "./animations";

// ============================================
// ANIMATED COUNTER HOOK
// ============================================

function useAnimatedCounter(value: number, duration: number = 1) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, motionValue, rounded]);

  return displayValue;
}

// ============================================
// TREND INDICATOR
// ============================================

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
}

const TrendIndicator = ({ value, suffix = "%" }: TrendIndicatorProps) => {
  const isPositive = value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className={`flex items-center gap-1 text-xs font-semibold ${
        isPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
      }`}
    >
      <motion.svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        initial={{ y: isPositive ? 5 : -5 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.6, type: "spring" }}
      >
        {isPositive ? (
          <path d="M18 15l-6-6-6 6" />
        ) : (
          <path d="M6 9l6 6 6-6" />
        )}
      </motion.svg>
      <span>
        {isPositive ? "+" : ""}
        {value}
        {suffix}
      </span>
    </motion.div>
  );
};

// ============================================
// SPARKLINE CHART
// ============================================

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

const Sparkline = ({ data, color = "var(--color-primary)", height = 30 }: SparklineProps) => {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <motion.polygon
        points={`0,${height} ${points} 100,${height}`}
        fill="url(#sparklineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </motion.svg>
  );
};

// ============================================
// PROGRESS RING
// ============================================

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressRing = ({
  value,
  max = 100,
  size = 60,
  strokeWidth = 6,
  color = "var(--color-primary)",
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);

  return (
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
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
};

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendSuffix?: string;
  icon?: ReactNode;
  sparklineData?: number[];
  target?: { value: number; label: string };
  className?: string;
  onClick?: () => void;
}

export const KPICard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendSuffix = "%",
  icon,
  sparklineData,
  target,
  className = "",
  onClick,
}: KPICardProps) => {
  const animatedValue = useAnimatedCounter(value);

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        border: "1px solid var(--border-soft)",
        background: "linear-gradient(135deg, var(--surface), var(--color-linen))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-plum)" }}
        >
          {title}
        </span>
        {icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-peach)" }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <motion.span
          className="text-3xl font-bold"
          style={{ color: "var(--color-charcoal)" }}
        >
          {prefix}
          {animatedValue.toLocaleString()}
          {suffix}
        </motion.span>
        {trend !== undefined && <TrendIndicator value={trend} suffix={trendSuffix} />}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color="var(--color-primary)" />
        </div>
      )}

      {/* Target Progress */}
      {target && (
        <div className="mt-3 flex items-center gap-3">
          <ProgressRing
            value={value}
            max={target.value}
            size={40}
            strokeWidth={4}
          />
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            <div>{target.label}</div>
            <div className="font-semibold" style={{ color: "var(--color-charcoal)" }}>
              {Math.round((value / target.value) * 100)}% of {target.value.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  if (onClick) {
    return (
      <HoverScale className="cursor-pointer" onClick={onClick}>
        {cardContent}
      </HoverScale>
    );
  }

  return cardContent;
};

// ============================================
// KPI CARD GRID
// ============================================

interface KPICardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const KPICardGrid = ({ children, columns = 4, className = "" }: KPICardGridProps) => {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
      className={`grid gap-4 ${gridCols[columns]} ${className}`}
    >
      {children}
    </motion.div>
  );
};
