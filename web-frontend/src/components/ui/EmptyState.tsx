"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { AnimatedButton } from "./Button";

// ============================================
// ANIMATED SVG ILLUSTRATIONS
// ============================================

const EmptyBoxIllustration = () => (
  <motion.svg
    width={120}
    height={120}
    viewBox="0 0 120 120"
    fill="none"
    initial="hidden"
    animate="visible"
  >
    {/* Box body */}
    <motion.path
      d="M20 45L60 25L100 45L100 90L60 110L20 90L20 45Z"
      fill="var(--color-peach)"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    />
    {/* Box top */}
    <motion.path
      d="M20 45L60 65L100 45L60 25L20 45Z"
      fill="var(--surface-muted)"
      stroke="var(--color-plum)"
      strokeWidth={2}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    {/* Box left side */}
    <motion.path
      d="M20 45L20 90L60 110L60 65L20 45Z"
      fill="var(--color-linen)"
      stroke="var(--color-plum)"
      strokeWidth={2}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    {/* Box right side */}
    <motion.path
      d="M60 65L60 110L100 90L100 45L60 65Z"
      fill="var(--surface)"
      stroke="var(--color-plum)"
      strokeWidth={2}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    {/* Question mark */}
    <motion.text
      x="60"
      y="82"
      textAnchor="middle"
      fontSize="28"
      fontWeight="bold"
      fill="var(--color-plum)"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      ?
    </motion.text>
  </motion.svg>
);

const NoDataIllustration = () => (
  <motion.svg
    width={120}
    height={120}
    viewBox="0 0 120 120"
    fill="none"
    initial="hidden"
    animate="visible"
  >
    {/* Chart bars background */}
    <motion.rect
      x="15"
      y="85"
      width="20"
      height="25"
      rx="4"
      fill="var(--surface-muted)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ originY: 1 }}
    />
    <motion.rect
      x="40"
      y="65"
      width="20"
      height="45"
      rx="4"
      fill="var(--surface-muted)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{ originY: 1 }}
    />
    <motion.rect
      x="65"
      y="50"
      width="20"
      height="60"
      rx="4"
      fill="var(--surface-muted)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{ originY: 1 }}
    />
    <motion.rect
      x="90"
      y="70"
      width="20"
      height="40"
      rx="4"
      fill="var(--surface-muted)"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      style={{ originY: 1 }}
    />
    {/* Dotted line */}
    <motion.line
      x1="10"
      y1="60"
      x2="115"
      y2="60"
      stroke="var(--color-plum)"
      strokeWidth={2}
      strokeDasharray="6 4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    />
    {/* Magnifying glass */}
    <motion.g
      initial={{ opacity: 0, scale: 0, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.7, type: "spring" }}
    >
      <circle cx="85" cy="30" r="15" fill="var(--color-peach)" stroke="var(--color-plum)" strokeWidth={3} />
      <line x1="96" y1="41" x2="108" y2="53" stroke="var(--color-plum)" strokeWidth={4} strokeLinecap="round" />
    </motion.g>
  </motion.svg>
);

const NoSearchResultsIllustration = () => (
  <motion.svg
    width={120}
    height={120}
    viewBox="0 0 120 120"
    fill="none"
    initial="hidden"
    animate="visible"
  >
    {/* Document stack */}
    <motion.rect
      x="25"
      y="35"
      width="70"
      height="75"
      rx="8"
      fill="var(--surface-muted)"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    />
    <motion.rect
      x="30"
      y="30"
      width="70"
      height="75"
      rx="8"
      fill="var(--color-linen)"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    />
    <motion.rect
      x="35"
      y="25"
      width="70"
      height="75"
      rx="8"
      fill="var(--surface)"
      stroke="var(--color-plum)"
      strokeWidth={2}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    />
    {/* Lines on document */}
    {[45, 60, 75].map((y, i) => (
      <motion.rect
        key={i}
        x="45"
        y={y}
        width={50 - i * 10}
        height="6"
        rx="3"
        fill="var(--surface-muted)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
      />
    ))}
    {/* X mark */}
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.7, type: "spring" }}
    >
      <circle cx="90" cy="85" r="18" fill="var(--color-error)" opacity={0.15} />
      <circle cx="90" cy="85" r="14" fill="var(--surface)" stroke="var(--color-error)" strokeWidth={2} />
      <path
        d="M84 79L96 91M96 79L84 91"
        stroke="var(--color-error)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </motion.g>
  </motion.svg>
);

const SuccessIllustration = () => (
  <motion.svg
    width={120}
    height={120}
    viewBox="0 0 120 120"
    fill="none"
    initial="hidden"
    animate="visible"
  >
    {/* Circle background */}
    <motion.circle
      cx="60"
      cy="60"
      r="50"
      fill="var(--color-success)"
      opacity={0.1}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    />
    <motion.circle
      cx="60"
      cy="60"
      r="40"
      fill="var(--color-success)"
      opacity={0.2}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
    />
    <motion.circle
      cx="60"
      cy="60"
      r="30"
      fill="var(--color-success)"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
    />
    {/* Check mark */}
    <motion.path
      d="M45 60L55 70L75 50"
      stroke="white"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    />
  </motion.svg>
);

// ============================================
// ILLUSTRATION MAP
// ============================================

const illustrations = {
  empty: EmptyBoxIllustration,
  noData: NoDataIllustration,
  noResults: NoSearchResultsIllustration,
  success: SuccessIllustration,
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  type?: keyof typeof illustrations;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  customIllustration?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  type = "empty",
  title,
  description,
  action,
  secondaryAction,
  customIllustration,
  className = "",
}: EmptyStateProps) => {
  const Illustration = illustrations[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {/* Illustration */}
      <motion.div
        className="mb-6"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {customIllustration || <Illustration />}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold mb-2"
        style={{ color: "var(--color-charcoal)" }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm max-w-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3"
        >
          {action && (
            <AnimatedButton variant="primary" onClick={action.onClick}>
              {action.label}
            </AnimatedButton>
          )}
          {secondaryAction && (
            <AnimatedButton variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </AnimatedButton>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// ============================================
// LOADING EMPTY STATE
// ============================================

export const LoadingEmptyState = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-10 h-10 rounded-full border-3 mb-4"
      style={{
        borderColor: "var(--surface-muted)",
        borderTopColor: "var(--color-primary)",
        borderWidth: 3,
      }}
    />
    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
      {message}
    </p>
  </div>
);
