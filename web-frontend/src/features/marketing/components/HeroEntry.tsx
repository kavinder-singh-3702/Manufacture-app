"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const stats = [
  { value: "6,200+", label: "Verified suppliers", icon: "🏭" },
  { value: "< 2h", label: "Median first reply", icon: "⚡" },
  { value: "94%", label: "On-time delivery", icon: "✅" },
] as const;

const chips = ["RFQ routing", "Compliance vault", "Supplier scorecards", "Shared timelines", "Real-time inventory"] as const;

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const commandDeckItems = [
  { label: "RFQs this week", value: "18 open", badge: "↑ 4", color: "var(--primary)", bg: "var(--primary-light)" },
  { label: "Pending compliance", value: "3 actions", badge: "Urgent", color: "var(--accent)", bg: "var(--accent-light)" },
  { label: "New supplier matches", value: "12 found", badge: "New", color: "#16A34A", bg: "#DCFCE7" },
];

export const HeroEntry = () => (
  <section
    className="relative overflow-hidden"
    style={{ background: "linear-gradient(160deg, #f8fafb 0%, #ffffff 50%, #f0f9ff 100%)" }}
  >
    {/* Background decorative gradient circles */}
    <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-20"
      style={{ background: "radial-gradient(circle, rgba(20,141,178,0.3), transparent 70%)" }} />
    <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-15"
      style={{ background: "radial-gradient(circle, rgba(213,97,109,0.3), transparent 70%)" }} />

    <div className="relative mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-10 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {/* Left: Copy */}
        <div className="space-y-8">
          <motion.div {...fade(0)}>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(20,141,178,0.2)" }}
            >
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
              Platform live · Serving Indian manufacturers
            </div>
          </motion.div>

          <motion.div {...fade(0.08)} className="space-y-4">
            <h1
              className="text-4xl font-bold leading-[1.12] tracking-tight md:text-5xl lg:text-6xl"
              style={{ color: "var(--foreground)" }}
            >
              Your manufacturing command centre{" "}
              <span style={{ color: "var(--primary)" }}>on the web.</span>
            </h1>
            <p className="text-lg leading-relaxed md:text-xl" style={{ color: "var(--medium-gray)" }}>
              ARVANN gives India&apos;s factories a single workspace for sourcing, compliance,
              inventory, and supplier comms — built for teams who move fast.
            </p>
          </motion.div>

          <motion.div {...fade(0.16)} className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)", boxShadow: "0 10px 30px rgba(20,141,178,0.35)" }}
            >
              Start free →
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold transition-all hover:shadow-md"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
            >
              Sign in to workspace
            </Link>
          </motion.div>

          {/* Feature chips */}
          <motion.div {...fade(0.22)} className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                {chip}
              </span>
            ))}
          </motion.div>

          {/* Stat cards */}
          <motion.div {...fade(0.28)} className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-xl">{stat.icon}</p>
                <p className="mt-2 text-xl font-bold" style={{ color: "var(--foreground)" }}>{stat.value}</p>
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: "var(--medium-gray)" }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Command deck preview */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Mock dashboard card */}
          <div
            className="overflow-hidden rounded-3xl"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              boxShadow: "0 30px 80px rgba(20,141,178,0.18), 0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* Mock topbar */}
            <div
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--gradient-brand-deep)" }}
            >
              <div className="flex gap-1.5">
                {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                  <div key={c} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white/60"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                arvann.app / dashboard
              </div>
            </div>

            {/* Mock content */}
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  Command Center
                </p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                  Live
                </span>
              </div>

              {commandDeckItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between rounded-2xl p-3.5"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-base font-bold" style={{ color: "var(--foreground)" }}>{item.value}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ backgroundColor: item.bg, color: item.color }}>
                    {item.badge}
                  </span>
                </motion.div>
              ))}

              {/* Progress bars */}
              <div className="rounded-2xl p-3.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>
                  Supplier health
                </p>
                {[
                  { label: "Quality score", pct: 92, color: "#16A34A" },
                  { label: "On-time delivery", pct: 78, color: "var(--primary)" },
                  { label: "Compliance rate", pct: 61, color: "var(--accent)" },
                ].map((bar) => (
                  <div key={bar.label} className="mb-2 last:mb-0">
                    <div className="mb-1 flex justify-between text-[10px]" style={{ color: "var(--foreground)" }}>
                      <span className="font-medium">{bar.label}</span>
                      <span className="font-bold">{bar.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: bar.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 20 }}
            className="absolute -bottom-4 -left-4 rounded-2xl px-4 py-3 shadow-lg"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Acme Textiles verified</p>
                <p className="text-[10px]" style={{ color: "var(--medium-gray)" }}>Compliance badge active</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);
