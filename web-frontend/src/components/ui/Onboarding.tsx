"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, createContext, useContext, type ReactNode, useCallback } from "react";

// ============================================
// ONBOARDING CONTEXT
// ============================================

interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingContextType {
  currentStep: number;
  steps: OnboardingStep[];
  isActive: boolean;
  start: (steps: OnboardingStep[]) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

// ============================================
// ONBOARDING PROVIDER
// ============================================

interface OnboardingProviderProps {
  children: ReactNode;
  onComplete?: () => void;
}

export const OnboardingProvider = ({ children, onComplete }: OnboardingProviderProps) => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback((newSteps: OnboardingStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsActive(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    setIsActive(false);
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  return (
    <OnboardingContext.Provider
      value={{ currentStep, steps, isActive, start, next, prev, skip, complete }}
    >
      {children}
      <OnboardingOverlay />
    </OnboardingContext.Provider>
  );
};

// ============================================
// ONBOARDING OVERLAY
// ============================================

const OnboardingOverlay = () => {
  const { steps, currentStep, isActive, next, prev, skip } = useOnboarding();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  // Find target element
  useState(() => {
    if (isActive && step) {
      const target = document.querySelector(step.target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });

  if (!isActive || !step) return null;

  const position = step.position || "bottom";
  const tooltipOffset = 12;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    switch (position) {
      case "top":
        return {
          top: targetRect.top - tooltipOffset,
          left: targetRect.left + targetRect.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: targetRect.bottom + tooltipOffset,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - tooltipOffset,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + tooltipOffset,
          transform: "translateY(-50%)",
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with spotlight */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#spotlight)"
          />
        </svg>

        {/* Highlight ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: 12,
              border: "2px solid var(--color-primary)",
              boxShadow: "0 0 0 4px rgba(17, 164, 64, 0.2)",
            }}
          >
            {/* Pulse effect */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-xl"
              style={{ border: "2px solid var(--color-primary)" }}
            />
          </motion.div>
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute w-80 rounded-2xl p-5 shadow-xl"
          style={{
            ...getTooltipPosition(),
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
          }}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-3">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full"
                animate={{
                  width: i === currentStep ? 24 : 8,
                  backgroundColor:
                    i === currentStep
                      ? "var(--color-primary)"
                      : i < currentStep
                      ? "var(--color-primary)"
                      : "var(--surface-muted)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Content */}
          <h4
            className="text-lg font-semibold mb-1"
            style={{ color: "var(--color-charcoal)" }}
          >
            {step.title}
          </h4>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={skip}
              className="text-sm font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prev}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--surface-muted)",
                    color: "var(--color-charcoal)",
                  }}
                >
                  Back
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 4px 12px rgba(17, 164, 64, 0.3)",
                }}
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// FEATURE HIGHLIGHT
// ============================================

interface FeatureHighlightProps {
  children: ReactNode;
  title: string;
  description: string;
  show: boolean;
  onDismiss: () => void;
  position?: "top" | "bottom" | "left" | "right";
}

export const FeatureHighlight = ({
  children,
  title,
  description,
  show,
  onDismiss,
  position = "bottom",
}: FeatureHighlightProps) => {
  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {show && (
          <>
            {/* Pulse ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -inset-2 rounded-xl pointer-events-none"
              style={{ border: "2px solid var(--color-primary)" }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-xl"
                style={{ border: "2px solid var(--color-primary)" }}
              />
            </motion.div>

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: position === "top" ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: position === "top" ? 10 : -10 }}
              className={`
                absolute z-50 w-64 p-4 rounded-xl shadow-lg
                ${position === "top" ? "bottom-full mb-3" : "top-full mt-3"}
                left-1/2 -translate-x-1/2
              `}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {/* Arrow */}
              <div
                className={`
                  absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45
                  ${position === "top" ? "-bottom-1.5" : "-top-1.5"}
                `}
                style={{
                  background: "var(--surface)",
                  borderRight: position === "top" ? "1px solid var(--border-soft)" : "none",
                  borderBottom: position === "top" ? "1px solid var(--border-soft)" : "none",
                  borderLeft: position === "bottom" ? "1px solid var(--border-soft)" : "none",
                  borderTop: position === "bottom" ? "1px solid var(--border-soft)" : "none",
                }}
              />

              <div className="flex items-start justify-between mb-2">
                <h5
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-charcoal)" }}
                >
                  {title}
                </h5>
                <button
                  onClick={onDismiss}
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {description}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// STEP PROGRESS
// ============================================

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const StepProgress = ({ steps, currentStep, className = "" }: StepProgressProps) => {
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((label, index) => (
        <div key={index} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                backgroundColor:
                  index <= currentStep ? "var(--color-primary)" : "var(--surface-muted)",
                scale: index === currentStep ? 1.1 : 1,
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                color: index <= currentStep ? "white" : "var(--color-text-muted)",
              }}
            >
              {index < currentStep ? (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              ) : (
                index + 1
              )}
            </motion.div>
            <span
              className="mt-2 text-xs font-medium whitespace-nowrap"
              style={{
                color: index <= currentStep ? "var(--color-charcoal)" : "var(--color-text-muted)",
              }}
            >
              {label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <motion.div
              className="h-0.5 mx-2"
              style={{ width: 40 }}
              animate={{
                backgroundColor:
                  index < currentStep ? "var(--color-primary)" : "var(--surface-muted)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
