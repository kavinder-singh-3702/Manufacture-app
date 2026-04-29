"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export const SignInFormPanel = ({ children }: { children: ReactNode }) => (
  <motion.div
    className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-12 lg:px-16"
    style={{ backgroundColor: "var(--background)" }}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
  >
    {/* Mobile logo */}
    <motion.div
      className="mb-10 flex items-center gap-2.5 lg:hidden"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: "linear-gradient(135deg, #148DB2, #0F6E8C)", boxShadow: "0 3px 10px rgba(20,141,178,0.35)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Manufacture</span>
    </motion.div>

    <div className="w-full max-w-[380px]">
      {children}
    </div>
  </motion.div>
);
