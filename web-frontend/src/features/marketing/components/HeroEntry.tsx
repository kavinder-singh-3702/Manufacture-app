"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, useMotionSafe } from "@/src/components/ui/motion";
import { Stat } from "@/src/components/ui/Surface";
import { AdBanner } from "@/src/features/ads/components/AdBanner";
import type { MarketplaceSnapshot } from "../server/publicData";

const previewRows = [
  { label: "Live sourcing", color: "var(--primary)" },
  { label: "Verified compliance", color: "var(--success)" },
  { label: "Direct RFQs", color: "var(--accent)" },
] as const;

/**
 * Animated, theme-aware landing hero. Replaces the previous version, which
 * (a) was hardcoded to a light-mode gradient and rendered white-on-white in
 * dark mode, and (b) published invented numbers ("6,200+ verified
 * suppliers", "94% on-time delivery") as fact. Every stat here comes from
 * `snapshot` (see server/publicData.ts::getMarketplaceSnapshot) — a null
 * field simply drops its tile instead of falling back to a placeholder.
 */
export const HeroEntry = ({ snapshot }: { snapshot: MarketplaceSnapshot }) => {
  const motionSafe = useMotionSafe();

  const stats = [
    snapshot.liveListings != null && { label: "Live listings", value: snapshot.liveListings },
    snapshot.industries != null && { label: "Industries covered", value: snapshot.industries },
    snapshot.specializations != null && { label: "Specializations", value: snapshot.specializations },
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <section className="relative overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Ambient background — slow-drifting brand-color mesh, stilled under prefers-reduced-motion */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
          animate={motionSafe ? { x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] } : undefined}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
          animate={motionSafe ? { x: [0, -20, 0], y: [0, 20, 0], scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left: copy */}
          <div className="space-y-8">
            <motion.h1
              {...fadeUp(0)}
              className="text-4xl font-bold leading-[1.12] tracking-tight md:text-5xl lg:text-6xl"
              style={{ color: "var(--foreground)" }}
            >
              Your manufacturing command centre{" "}
              <span style={{ color: "var(--primary)" }}>on the web.</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.08)}
              className="max-w-xl text-lg leading-relaxed md:text-xl"
              style={{ color: "var(--medium-gray)" }}
            >
              ARVANN gives India&apos;s factories a single workspace for sourcing, compliance,
              inventory, and supplier communication.
            </motion.p>

            <motion.div {...fadeUp(0.16)} className="flex flex-wrap gap-3">
              <Link
                href="/welcome"
                className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
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

            {stats.length > 0 && (
              <motion.div {...fadeUp(0.24)} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
                {stats.map((stat) => (
                  <Stat key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: product preview illustration (not a data claim — an illustrative mock of the workspace) */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            aria-hidden
          >
            <div
              className="overflow-hidden rounded-3xl"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--gradient-brand-deep)" }}
              >
                <div className="flex gap-1.5">
                  {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                    <div key={c} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  arvann.app / dashboard
                </div>
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                    Command Center
                  </p>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    Live
                  </span>
                </div>

                {previewRows.map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 rounded-2xl p-3.5"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                  >
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{row.label}</p>
                  </motion.div>
                ))}

                {snapshot.categoryNames.length > 0 && (
                  <div className="rounded-2xl p-3.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>
                      On the marketplace
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {snapshot.categoryNames.map((name) => (
                        <span
                          key={name}
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sponsored banner — edge-to-edge, above the fold */}
      <div className="relative mx-auto w-full max-w-[1600px] px-6 pb-16 lg:px-10">
        <AdBanner placement="hero_banner" />
      </div>
    </section>
  );
};
