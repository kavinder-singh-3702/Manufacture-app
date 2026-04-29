"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  "Connect with verified manufacturers & traders",
  "Manage RFQs, quotes and purchase orders",
  "Real-time inventory & stock tracking",
  "Secure Razorpay-powered payments",
];

const item = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: [0.22, 1, 0.36, 1] },
});

const slideLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, delay, ease: [0.22, 1, 0.36, 1] },
});

export const SignInHero = () => (
  <div
    className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[52%]"
    style={{ background: "linear-gradient(150deg, #148DB2 0%, #0D6A8A 55%, #0B5472 100%)" }}
  >
    {/* Animated decorative circles */}
    <motion.div
      className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    />
    <motion.div
      className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.4, delay: 0.1, ease: "easeOut" }}
    />
    <motion.div
      className="pointer-events-none absolute bottom-32 right-12 h-40 w-40 rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
    />

    {/* Logo */}
    <motion.div {...slideLeft(0.1)} className="relative flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-xl font-bold text-white">Manufacture</span>
    </motion.div>

    {/* Hero */}
    <div className="relative space-y-8">
      <div className="space-y-4">
        <motion.div {...item(0.2)}>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            Platform live · India
          </div>
        </motion.div>

        <motion.h1 {...item(0.3)} className="text-4xl font-bold leading-tight text-white lg:text-5xl">
          Your manufacturing<br />command centre.
        </motion.h1>

        <motion.p {...item(0.4)} className="text-[17px] leading-relaxed text-white/70">
          One secure login to connect with verified suppliers, manage your pipeline, and grow your business.
        </motion.p>
      </div>

      {/* Feature list */}
      <ul className="space-y-3">
        {FEATURES.map((feat, i) => (
          <motion.li key={feat} {...item(0.5 + i * 0.08)} className="flex items-center gap-3">
            <motion.span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              whileHover={{ scale: 1.2, backgroundColor: "rgba(255,255,255,0.30)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
            <span className="text-sm text-white/80">{feat}</span>
          </motion.li>
        ))}
      </ul>
    </div>

    {/* Sign up CTA */}
    <motion.div
      {...item(0.9)}
      className="relative flex items-center justify-between gap-4 rounded-2xl p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
    >
      <div>
        <p className="text-sm font-semibold text-white">New to Manufacture?</p>
        <p className="text-xs text-white/60">Create your workspace in 3 minutes</p>
      </div>
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/signup"
          className="flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: "#D5616D", boxShadow: "0 4px 14px rgba(213,97,109,0.40)" }}
        >
          Sign up →
        </Link>
      </motion.div>
    </motion.div>
  </div>
);
