"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { BrandWordmark } from "@/src/components/BrandLogo";

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
      className="mb-10 flex items-center lg:hidden"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <BrandWordmark height={28} priority />
    </motion.div>

    <div className="w-full max-w-[380px]">
      {children}
    </div>
  </motion.div>
);
