"use client";

/**
 * App-parity gradient service card — diagonal gradient, decorative orb,
 * frosted white CTA pill with a colored arrow circle. Ported from the app's
 * `ServiceTypeCard` (services screen) + `services.palette.ts` gradients.
 *
 * Purely presentational: it takes a `ServiceCatalogMeta`-shaped object and
 * either an `onStart`/`onClick` handler or an `href`, so the same component
 * renders the 4 real service types (data from content/catalog.ts) AND the
 * "Start your own business" 5th card (BUSINESS_CATALOG_META) — one gradient
 * card component instead of one bespoke block per surface.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ServiceCardMeta = {
  emoji: string;
  title: string;
  subtitle: string;
  hint: string;
  accent: string;
  gradient: readonly [string, string];
  glow: string;
};

type ServiceTypeCardProps = {
  meta: ServiceCardMeta;
  /** Compact pill chip for the "Service type: [x] [x] [x]" selector row. */
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
  /** Primary CTA — a callback (opens the request form inline) ... */
  onStart?: () => void;
  /** ...or a destination (the business-setup card navigates instead of switching form state). */
  href?: string;
  ctaLabel?: string;
};

const CardShell = ({ href, children, style, className }: { href?: string; children: ReactNode; style: React.CSSProperties; className: string }) =>
  href ? (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  ) : (
    <div className={className} style={style}>
      {children}
    </div>
  );

export const ServiceTypeCard = ({ meta, compact, selected, onClick, onStart, href, ctaLabel = "Start request" }: ServiceTypeCardProps) => {
  const [from, to] = meta.gradient;

  if (compact) {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all"
        style={{
          border: selected ? `1.5px solid ${meta.accent}` : "1px solid var(--border)",
          backgroundColor: selected ? `color-mix(in srgb, ${meta.accent} 14%, transparent)` : "var(--surface)",
        }}
      >
        <span className="text-base">{meta.emoji}</span>
        <span className="text-xs font-semibold" style={{ color: selected ? meta.accent : "var(--foreground)" }}>
          {meta.title}
        </span>
        {selected && (
          <span
            className="ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: meta.accent }}
          >
            ✓
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} className="h-full">
      <CardShell
        href={href}
        className="relative flex h-full flex-col overflow-hidden rounded-3xl p-5"
        style={{
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          boxShadow: `0 10px 24px ${meta.glow}`,
          border: selected ? `1.5px solid ${meta.accent}` : "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {/* Decorative orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${meta.accent} 15%, transparent)` }}
        />

        <div className="relative flex flex-1 flex-col">
          <div className="flex items-start gap-3">
            <span
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
            >
              {meta.emoji}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[15px] font-extrabold leading-tight tracking-[-0.01em] text-white">{meta.title}</p>
              <p className="mt-1 text-xs font-medium leading-snug text-white/75">{meta.subtitle}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-1 items-start gap-1.5 rounded-lg px-2.5 py-2" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.7)" }}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 11v5M12 8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-medium leading-snug text-white/85">{meta.hint}</span>
          </div>

          {(onStart || href) && (
            <button
              type="button"
              onClick={onStart}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-extrabold tracking-[0.01em] transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: "rgba(255,255,255,0.96)", color: from }}
            >
              {ctaLabel}
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ backgroundColor: from }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </CardShell>
    </motion.div>
  );
};
