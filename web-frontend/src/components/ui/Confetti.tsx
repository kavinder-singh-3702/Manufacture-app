"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

// ============================================
// CONFETTI PARTICLE
// ============================================

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: "circle" | "square" | "triangle";
  delay: number;
}

const COLORS = [
  "var(--color-primary)",
  "var(--color-peach)",
  "var(--color-plum)",
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
];

const generateParticles = (count: number): ConfettiParticle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: (["circle", "square", "triangle"] as const)[Math.floor(Math.random() * 3)],
    delay: Math.random() * 0.5,
  }));
};

const ParticleShape = ({ shape, color }: { shape: ConfettiParticle["shape"]; color: string }) => {
  switch (shape) {
    case "circle":
      return <circle cx="6" cy="6" r="6" fill={color} />;
    case "square":
      return <rect width="10" height="10" x="1" y="1" fill={color} />;
    case "triangle":
      return <polygon points="6,0 12,12 0,12" fill={color} />;
  }
};

// ============================================
// CONFETTI COMPONENT
// ============================================

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

export const Confetti = ({ active, duration = 3000, particleCount = 50, onComplete }: ConfettiProps) => {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles(particleCount));
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, particleCount, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((particle) => (
            <motion.svg
              key={particle.id}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              initial={{
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                rotate: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: particle.rotation + 720,
                scale: particle.scale,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: "absolute",
              }}
            >
              <ParticleShape shape={particle.shape} color={particle.color} />
            </motion.svg>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// SUCCESS CELEBRATION
// ============================================

interface SuccessCelebrationProps {
  show: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
}

export const SuccessCelebration = ({
  show,
  title = "Congratulations!",
  message = "You've achieved something great!",
  onClose,
}: SuccessCelebrationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
    }
  }, [show]);

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <AnimatePresence>
        {show && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
            >
              <div
                className="rounded-3xl p-8 text-center"
                style={{
                  background: "linear-gradient(135deg, var(--surface), var(--color-linen))",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                {/* Animated checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-success)" }}
                >
                  <motion.svg
                    width={40}
                    height={40}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth={3}
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    />
                  </motion.svg>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--color-charcoal)" }}
                >
                  {title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm mb-6"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {message}
                </motion.p>

                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white"
                  style={{
                    backgroundColor: "var(--color-plum)",
                    boxShadow: "0 4px 12px rgba(90, 48, 66, 0.3)",
                  }}
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================
// USE CELEBRATION HOOK
// ============================================

export const useCelebration = () => {
  const [isActive, setIsActive] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ title: "", message: "" });

  const celebrate = useCallback((title?: string, message?: string) => {
    setCelebrationData({
      title: title || "Success!",
      message: message || "Great job!",
    });
    setIsActive(true);
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
  }, []);

  const CelebrationComponent = () => (
    <SuccessCelebration
      show={isActive}
      title={celebrationData.title}
      message={celebrationData.message}
      onClose={close}
    />
  );

  return { celebrate, close, CelebrationComponent };
};
