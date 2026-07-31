"use client";

/**
 * Shared layout primitives — Card / Section / PageHeader / Stat.
 *
 * Before this file, every feature re-implemented its own "card" as an inline
 * `rounded-2xl border border-[var(--border)] bg-[var(--card)]` div, and every
 * section header re-typed its own eyebrow/title/subtitle block. This is the
 * single home for both shapes so they stay visually consistent and so
 * dropping the subtext/eyebrow lines (professional, less consumer-y) only
 * has to happen once. Reuses the existing motion tokens from ./motion —
 * do not redefine fade/stagger locally in feature code.
 */

import { type ReactNode, type HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./charts";
import { fadeInUpVariant, useMotionSafe } from "./motion";

// ── Card ─────────────────────────────────────────────────────────────────

type CardTone = "surface" | "card" | "muted";

const toneBg: Record<CardTone, string> = {
  surface: "var(--surface)",
  card: "var(--card)",
  muted: "var(--background)",
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Lifts + shadows on hover — use for clickable/navigable cards. */
  interactive?: boolean;
  tone?: CardTone;
  padding?: "none" | "sm" | "md" | "lg";
  as?: never;
};

const paddingClass: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export const Card = ({
  children,
  interactive = false,
  tone = "card",
  padding = "md",
  className = "",
  style,
  ...rest
}: CardProps) => (
  <div
    className={`rounded-2xl transition-all duration-200 ${paddingClass[padding]} ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]" : ""} ${className}`}
    style={{
      border: "1px solid var(--border)",
      backgroundColor: toneBg[tone],
      boxShadow: "var(--shadow-sm)",
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

// ── Section ──────────────────────────────────────────────────────────────

export type SectionProps = {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Reveal on scroll instead of on mount — for long marketing pages. */
  reveal?: boolean;
};

/**
 * A titled block of content. Deliberately has no `eyebrow`/`description`
 * prop — that subtext pattern is what we're removing across the app, so the
 * type itself should make it awkward to add back.
 */
export const Section = ({ title, action, children, className = "", reveal = false }: SectionProps) => {
  const motionSafe = useMotionSafe();
  const viewportProps = reveal ? { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-40px" } } : { initial: "hidden", animate: "visible" };

  return (
    <section className={className}>
      <motion.div
        {...viewportProps}
        variants={motionSafe ? fadeInUpVariant : undefined}
        className="mb-5 flex items-center justify-between gap-4"
      >
        <h2 className="text-xl font-bold tracking-tight md:text-2xl" style={{ color: "var(--foreground)" }}>
          {title}
        </h2>
        {action}
      </motion.div>
      {children}
    </section>
  );
};

// ── PageHeader ───────────────────────────────────────────────────────────

export type PageHeaderProps = {
  title: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Replaces the bespoke header block each dashboard container re-implements
 * (breadcrumb row + title + action buttons). One line, no subtitle — page
 * identity should be obvious from the breadcrumb + nav, not restated.
 */
export const PageHeader = ({ title, breadcrumb, actions, className = "" }: PageHeaderProps) => (
  <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      {breadcrumb && (
        <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--medium-gray)" }}>
          {breadcrumb}
        </div>
      )}
      <h1 className="truncate text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
        {title}
      </h1>
    </div>
    {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

// ── Stat ─────────────────────────────────────────────────────────────────

export type StatProps = {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: { value: string; tone: "positive" | "negative" | "neutral" };
  icon?: ReactNode;
};

const deltaColor: Record<NonNullable<StatProps["delta"]>["tone"], string> = {
  positive: "var(--success)",
  negative: "var(--error)",
  neutral: "var(--medium-gray)",
};

export const Stat = ({ label, value, format, delta, icon }: StatProps) => (
  <Card padding="md">
    <div className="flex items-start justify-between gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>
        {label}
      </p>
      {icon}
    </div>
    <p className="mt-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
      <AnimatedNumber value={value} format={format} />
    </p>
    {delta && (
      <p className="mt-1 text-xs font-semibold" style={{ color: deltaColor[delta.tone] }}>
        {delta.value}
      </p>
    )}
  </Card>
);
