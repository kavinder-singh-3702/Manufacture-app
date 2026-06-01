"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  { icon: "🏭", text: "Create manufacturer, trader, or buyer workspaces" },
  { icon: "✅", text: "Get compliance-verified with GST & Aadhaar" },
  { icon: "📦", text: "List products and receive real-time RFQs" },
  { icon: "💬", text: "Chat with buyers and suppliers in one thread" },
  { icon: "📊", text: "Track invoices, P&L, and inventory live" },
];

const stats = [
  { value: "6,200+", label: "Verified manufacturers" },
  { value: "< 48h", label: "Verification turnaround" },
  { value: "14", label: "Industry categories" },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export const SignupHero = () => (
  <div
    className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[480px] lg:flex-shrink-0"
    style={{ background: "linear-gradient(160deg, #0F6E8C 0%, #148DB2 40%, #1DA8D4 100%)", color: "#fff" }}
  >
    {/* Decorative circles */}
    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-[0.08]" style={{ backgroundColor: "#fff" }} />
    <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full opacity-[0.06]" style={{ backgroundColor: "#fff" }} />
    <div className="pointer-events-none absolute bottom-32 right-8 h-32 w-32 rounded-full opacity-[0.05]" style={{ backgroundColor: "#fff" }} />

    <div className="relative space-y-8">
      {/* Brand */}
      <motion.div {...fade(0)} className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Manufacture</p>
          <p className="text-lg font-bold">Command</p>
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div {...fade(0.1)} className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
          Free to join · No credit card
        </div>
        <h2 className="text-3xl font-bold leading-tight">
          Your manufacturing workspace starts here.
        </h2>
        <p className="text-base text-white/75">
          Join 6,200+ manufacturers, traders, and buyers already on the platform.
        </p>
      </motion.div>

      {/* Features list */}
      <div className="space-y-2.5">
        {features.map((f, i) => (
          <motion.div
            key={f.text}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
            className="flex items-center gap-3"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/12 text-base">
              {f.icon}
            </span>
            <span className="text-sm text-white/85">{f.text}</span>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Stats row */}
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
      className="relative grid grid-cols-3 gap-3"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl p-4 text-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <p className="text-xl font-bold">{s.value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-white/70">{s.label}</p>
        </div>
      ))}
    </motion.div>

    {/* Already have account */}
    <motion.p
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      className="relative mt-4 text-center text-sm text-white/60"
    >
      Already have an account?{" "}
      <Link href="/signin" className="font-semibold text-white transition-opacity hover:opacity-80">
        Sign in →
      </Link>
    </motion.p>
  </div>
);
