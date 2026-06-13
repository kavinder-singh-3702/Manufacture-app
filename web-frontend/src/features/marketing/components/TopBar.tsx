"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandWordmark } from "@/src/components/BrandLogo";
import { useAuth } from "@/src/hooks/useAuth";

const CATEGORIES = [
  { id: "food-beverage-manufacturing",          title: "Food & Beverage",   icon: "🍚" },
  { id: "textile-apparel-manufacturing",        title: "Textile & Apparel", icon: "👕" },
  { id: "paper-packaging-industry",             title: "Paper & Pack",      icon: "📦" },
  { id: "chemical-manufacturing",               title: "Chemicals",         icon: "⚗️" },
  { id: "pharmaceutical-medical",               title: "Pharma",            icon: "💊" },
  { id: "plastic-polymer-industry",             title: "Plastics",          icon: "🧴" },
  { id: "rubber-industry",                      title: "Rubber",            icon: "🛞" },
  { id: "metal-steel-industry",                 title: "Metal & Steel",     icon: "🏗️" },
  { id: "automobile-auto-components",           title: "Automobile",        icon: "🚗" },
  { id: "electrical-electronics-manufacturing", title: "Electronics",       icon: "🔌" },
  { id: "machinery-heavy-engineering",          title: "Machinery",         icon: "⚙️" },
  { id: "wood-furniture-industry",              title: "Wood & Furniture",  icon: "🪑" },
  { id: "construction-material-industry",       title: "Construction",      icon: "🧱" },
  { id: "consumer-goods-fmcg",                  title: "Consumer Goods",    icon: "🧼" },
  { id: "defence-aerospace-manufacturing",      title: "Aerospace",         icon: "✈️" },
  { id: "handicrafts-cottage-industries",       title: "Handicrafts",       icon: "🧶" },
] as const;

const navLinks = [
  { href: "/products", label: "Products", hasDropdown: true },
  { href: "#overview", label: "Platform",  hasDropdown: false },
  { href: "#support",  label: "Support",   hasDropdown: false },
] as const;

// ── Category mega-dropdown ────────────────────────────────────────────────────
const CategoryDropdown = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 6, scale: 0.98 }}
    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    className="absolute left-0 top-full z-50 mt-2 w-[680px] overflow-hidden rounded-2xl shadow-2xl"
    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
    <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Browse by industry</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>India&apos;s manufacturing marketplace</p>
        </div>
        <Link href="/products" onClick={onClose}
          className="rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--primary)" }}>
          View all →
        </Link>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-1 p-3">
      {CATEGORIES.map((cat) => (
        <Link key={cat.id} href={`/products/category/${cat.id}`} onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:bg-[var(--primary-light)]">
          <span className="text-lg flex-shrink-0">{cat.icon}</span>
          <span className="text-xs font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{cat.title}</span>
        </Link>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2 p-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
      <Link href="/products" onClick={onClose}
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
        style={{ color: "var(--primary)" }}>
        <span>🛍️</span> All products
      </Link>
      <Link href="/dashboard/products/search" onClick={onClose}
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
        style={{ color: "var(--foreground)" }}>
        <span>🔍</span> Search products
      </Link>
    </div>
  </motion.div>
);

// ── TopBar ────────────────────────────────────────────────────────────────────
export const TopBar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, initializing } = useAuth();
  const isAuthed = !initializing && !!user;
  const accountLabel = user?.displayName ?? user?.firstName ?? user?.email ?? "Account";

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md"
      style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(248,250,251,0.95)", boxShadow: "0 1px 0 var(--border), 0 4px 20px rgba(20,141,178,0.05)" }}>
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-3.5 lg:px-10">
        {/* Brand */}
        <Link href="/" className="flex items-center flex-shrink-0" aria-label="ARVANN home">
          <BrandWordmark height={30} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) =>
            link.hasDropdown ? (
              <div key={link.label} ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                  style={{ color: dropdownOpen ? "var(--primary)" : "var(--foreground)", backgroundColor: dropdownOpen ? "var(--primary-light)" : "transparent" }}>
                  {link.label}
                  <motion.svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {dropdownOpen && <CategoryDropdown onClose={() => setDropdownOpen(false)} />}
                </AnimatePresence>
              </div>
            ) : (
              <a key={link.label} href={link.href}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                style={{ color: "var(--foreground)" }}>
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          {isAuthed ? (
            <Link href="/dashboard"
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "var(--foreground)", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: "var(--primary)" }}>
                {accountLabel.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[140px] truncate">{accountLabel}</span>
            </Link>
          ) : (
            <>
              <Link href="/signin" className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--foreground)" }}>
                Sign in
              </Link>
              <Link href="/signup"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                Get started free →
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button type="button" onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}>
          <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" animate={{ rotate: mobileOpen ? 45 : 0 }}>
            {mobileOpen
              ? <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              : <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            }
          </motion.svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            className="overflow-hidden border-t px-6 pb-5 pt-3 lg:hidden"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <nav className="space-y-1">
              <Link href="/products" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:bg-[var(--primary-light)]"
                style={{ color: "var(--primary)" }}>
                🛍️ Products & Marketplace
              </Link>
              {/* Category list on mobile */}
              <div className="grid grid-cols-2 gap-1 px-1 py-2">
                {CATEGORIES.slice(0, 8).map((cat) => (
                  <Link key={cat.id} href={`/products/category/${cat.id}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-[var(--primary-light)]"
                    style={{ color: "var(--foreground)" }}>
                    <span>{cat.icon}</span>{cat.title}
                  </Link>
                ))}
              </div>
              <a href="#overview" onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
                style={{ color: "var(--foreground)" }}>Platform</a>
              <a href="#support" onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
                style={{ color: "var(--foreground)" }}>Support</a>
            </nav>
            <div className="mt-4 grid gap-2">
              {isAuthed ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold"
                  style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--primary-light)" }}>
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}>
                    {accountLabel.charAt(0).toUpperCase()}
                  </span>
                  {accountLabel} · Dashboard
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
