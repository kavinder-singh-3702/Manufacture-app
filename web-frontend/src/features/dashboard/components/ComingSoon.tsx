"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

type ComingSoonProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent: string;
  bullets?: string[];
};

export const ComingSoon = ({ eyebrow, title, description, icon, accent, bullets }: ComingSoonProps) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center rounded-3xl p-10 text-center md:p-16"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <span
        className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <p
        className="mt-5 text-xs font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {eyebrow} · Coming soon
      </p>
      <h1 className="mt-2 text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm md:text-base" style={{ color: "var(--medium-gray)" }}>
        {description}
      </p>

      {bullets && bullets.length > 0 ? (
        <ul className="mt-6 grid w-full max-w-md gap-2 text-left">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-2 rounded-2xl px-4 py-2.5 text-sm"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <span
                className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              >
                ✓
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
        >
          Back to dashboard
        </Link>
        <Link
          href="/dashboard/notifications"
          className="rounded-full border px-5 py-2.5 text-sm font-semibold"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Notify me when ready
        </Link>
      </div>
    </motion.div>
  );
};
