"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

// ============================================
// BASE SKELETON COMPONENT
// ============================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  className = "",
}: SkeletonProps) => {
  return (
    <motion.div
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--surface-muted) 0%, var(--color-peach) 50%, var(--surface-muted) 100%)",
        backgroundSize: "200% 100%",
      }}
      className={className}
    />
  );
};

// ============================================
// SKELETON VARIANTS
// ============================================

export const SkeletonText = ({ lines = 3, className = "" }: { lines?: number; className?: string }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? "60%" : "100%"}
          borderRadius={4}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({ size = 40, className = "" }: { size?: number; className?: string }) => {
  return <Skeleton width={size} height={size} borderRadius="50%" className={className} />;
};

export const SkeletonCard = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        border: "1px solid var(--border-soft)",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <SkeletonAvatar size={48} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="40%" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="mt-4 flex gap-2">
        <Skeleton height={36} width={100} borderRadius={18} />
        <Skeleton height={36} width={80} borderRadius={18} />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, className = "" }: { rows?: number; columns?: number; className?: string }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 pb-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={14} width={`${100 / columns}%`} borderRadius={4} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height={16}
              width={`${100 / columns}%`}
              borderRadius={4}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonKPICard = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        border: "1px solid var(--border-soft)",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <Skeleton height={12} width="50%" borderRadius={4} />
        <Skeleton height={24} width={24} borderRadius="50%" />
      </div>
      <Skeleton height={32} width="40%" borderRadius={6} className="mb-2" />
      <Skeleton height={10} width="70%" borderRadius={4} />
    </div>
  );
};

export const SkeletonListItem = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      <SkeletonAvatar size={40} />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="60%" />
        <Skeleton height={12} width="40%" />
      </div>
      <Skeleton height={28} width={60} borderRadius={14} />
    </div>
  );
};

// ============================================
// SKELETON WRAPPER
// ============================================

interface SkeletonWrapperProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export const SkeletonWrapper = ({ loading, skeleton, children }: SkeletonWrapperProps) => {
  if (loading) {
    return <>{skeleton}</>;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// DASHBOARD SKELETON
// ============================================

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height={28} width={200} borderRadius={6} />
          <Skeleton height={14} width={300} borderRadius={4} />
        </div>
        <Skeleton height={40} width={120} borderRadius={20} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard />
        </div>
        <div>
          <div
            className="rounded-2xl p-5"
            style={{
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
            }}
          >
            <Skeleton height={20} width="50%" borderRadius={4} className="mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
