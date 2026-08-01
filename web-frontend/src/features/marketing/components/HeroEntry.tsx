"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, useMotionSafe } from "@/src/components/ui/motion";
import { Stat } from "@/src/components/ui/Surface";
import { AnimatedNumber } from "@/src/components/ui/charts";
import { AdBanner } from "@/src/features/ads/components/AdBanner";
import type { MarketplaceSnapshot } from "../server/publicData";

// Per-card accent + independent drift timing/amplitude for the floating
// glass stat cards — deliberately not in lockstep, so the cluster reads as
// "live" rather than a single mechanically synced animation.
const GLASS_CARD_STYLE = [
  { color: "var(--primary)", duration: 5.5, amplitude: 9 },
  { color: "var(--accent)", duration: 7, amplitude: 6 },
  { color: "var(--success)", duration: 6.2, amplitude: 11 },
] as const;

/**
 * Animated, theme-aware landing hero. Replaces the previous version, which
 * (a) was hardcoded to a light-mode gradient and rendered white-on-white in
 * dark mode, and (b) published invented numbers ("6,200+ verified
 * suppliers", "94% on-time delivery") as fact. Every stat here comes from
 * `snapshot` (see server/publicData.ts::getMarketplaceSnapshot) — a null
 * field simply drops its tile instead of falling back to a placeholder.
 *
 * The right-hand visual used to be a generic "mock browser window" SaaS
 * illustration with fake preview rows. It's now a layered abstract mesh
 * (multiple drifting blurred blobs at different depths/speeds + a faint
 * blueprint/engineering-grid texture, nodding at manufacturing) with the
 * SAME real snapshot numbers as the left-side `Stat` row surfaced again as
 * floating frosted-glass cards — so the hero visual is actual live data,
 * not decoration standing in for it.
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
      {/* Ambient background — layered slow-drifting brand-color mesh at varied
          depth/blur/speed, plus a faint blueprint-grid texture, stilled under
          prefers-reduced-motion */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse 80% 60% at 65% 30%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 65% 30%, black, transparent 75%)",
          }}
        />
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
        <motion.div
          className="absolute right-[8%] top-[38%] h-64 w-64 rounded-full opacity-[0.12] blur-2xl"
          style={{ background: "radial-gradient(circle, var(--success), transparent 70%)" }}
          animate={motionSafe ? { x: [0, -16, 0], y: [0, 18, 0], scale: [1, 1.12, 1] } : undefined}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-16 top-8 h-72 w-72 rounded-full opacity-[0.1] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
          animate={motionSafe ? { x: [0, 14, 0], y: [0, -12, 0], scale: [1, 1.06, 1] } : undefined}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
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
              India&apos;s B2B marketplace{" "}
              <span style={{ color: "var(--primary)" }}>for manufacturers &amp; suppliers.</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.08)}
              className="max-w-xl text-lg leading-relaxed md:text-xl"
              style={{ color: "var(--medium-gray)" }}
            >
              ARVANN connects buyers with verified Indian manufacturers, suppliers, traders and
              exporters — plus a single command centre for sourcing, compliance, inventory, and
              supplier communication.
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

          {/* Right: premium abstract mesh + floating glass stat cards. Reuses
              the exact `stats` computed above (same snapshot data as the
              left `Stat` row) — aria-hidden so screen readers aren't handed
              the same three numbers twice. */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            aria-hidden
          >
            <div
              className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
              style={{ border: "1px solid var(--border)", backgroundColor: "color-mix(in srgb, var(--surface) 60%, transparent)", boxShadow: "var(--shadow-lg)" }}
            >
              {/* Depth layer local to the panel — separate timing from the
                  section-wide blobs so nothing drifts in lockstep */}
              <motion.div
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-25 blur-2xl"
                style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
                animate={motionSafe ? { x: [0, 18, 0], y: [0, -14, 0] } : undefined}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full opacity-20 blur-2xl"
                style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
                animate={motionSafe ? { x: [0, -14, 0], y: [0, 12, 0] } : undefined}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  Live on ARVANN
                </p>
                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "var(--primary)" }}
                    animate={motionSafe ? { opacity: [1, 0.35, 1] } : undefined}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  Live
                </span>
              </div>

              {stats.length > 0 ? (
                <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
                  {stats.map((stat, i) => {
                    const style = GLASS_CARD_STYLE[i % GLASS_CARD_STYLE.length];
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                        className={i === 0 ? "sm:col-span-2" : ""}
                      >
                        <motion.div
                          className="rounded-2xl p-4"
                          style={{
                            border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                            backgroundColor: "color-mix(in srgb, var(--card) 65%, transparent)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            boxShadow: "var(--shadow-sm)",
                          }}
                          animate={motionSafe ? { y: [0, -style.amplitude, 0] } : undefined}
                          transition={{ duration: style.duration, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: style.color }} />
                            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>
                              {stat.label}
                            </p>
                          </div>
                          <p className={`mt-1.5 font-bold ${i === 0 ? "text-4xl" : "text-2xl"}`} style={{ color: "var(--foreground)" }}>
                            <AnimatedNumber value={stat.value} duration={1.2} />
                          </p>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative mt-6 rounded-2xl p-6 text-center" style={{ border: "1px dashed var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>
                    Connecting India&apos;s manufacturing network
                  </p>
                </div>
              )}

              {snapshot.categoryNames.length > 0 && (
                <div
                  className="relative mt-4 rounded-2xl p-3.5"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--card) 50%, transparent)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
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
