"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#support", label: "Support" },
] as const;

export const TopBar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur-md"
      style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(248,250,251,0.92)", boxShadow: "0 1px 0 var(--border), 0 4px 20px rgba(20,141,178,0.05)" }}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-3.5 lg:px-10">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: "var(--gradient-brand-strong)", boxShadow: "var(--shadow-primary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] leading-none" style={{ color: "var(--primary)" }}>
              Manufacture
            </p>
            <p className="text-base font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              Command
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label} href={link.href}
              className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
              style={{ color: "var(--foreground)" }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/signin"
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--foreground)", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
            Sign in
          </Link>
          <Link href="/signup"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            Get started free →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" animate={{ rotate: mobileOpen ? 45 : 0 }}>
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </motion.svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t px-6 pb-5 pt-3 lg:hidden"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
                  style={{ color: "var(--foreground)" }}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2">
              <Link href="/signin" onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-center text-sm font-semibold"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--background)" }}>
                Sign in
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="block rounded-xl py-3 text-center text-sm font-bold text-white"
                style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                Get started free →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
