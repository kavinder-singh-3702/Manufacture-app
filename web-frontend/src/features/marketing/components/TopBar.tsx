"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandWordmark } from "@/src/components/BrandLogo";
import { useAuth } from "@/src/hooks/useAuth";
import { SearchBar, buildSearchHref, PRODUCT_SEARCH_ROUTES } from "@/src/features/search";
import { PRODUCT_CATEGORIES, getCategoryHref } from "@/src/features/product/utils/categories";

// Used to be a hand-maintained 16-entry duplicate of the categories list
// (independently drifted from src/features/product/utils/categories.ts, the
// same drift bug that list had) — now the single canonical source, so this
// mega-menu can never again silently omit an industry that exists everywhere
// else in the app. Full PRODUCT_CATEGORIES (27), not just the 20 real
// industries — app parity with the mobile home's category grid, which has
// always included the 7 legacy catch-all buckets too.
const CATEGORIES = PRODUCT_CATEGORIES;

const navLinks = [
  { href: "/products", label: "Products", hasDropdown: true },
  { href: "/shop",     label: "Shop",     hasDropdown: false },
  { href: "/about",    label: "About",    hasDropdown: false },
  { href: "/support",  label: "Support",  hasDropdown: false },
  { href: "/contact",  label: "Contact",  hasDropdown: false },
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
    {/* max-h + scroll — 27 categories at grid-cols-4 is 7 rows, taller than
        some laptop viewports fit below the topbar. */}
    <div className="grid max-h-[60vh] grid-cols-4 gap-1 overflow-y-auto p-3">
      {CATEGORIES.map((cat) => (
        <Link key={cat.id} href={getCategoryHref(cat.id)} onClick={onClose}
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
      {/* Public route — this used to point at /dashboard/products/search,
          which bounced signed-out visitors to the sign-in page. */}
      <Link href={PRODUCT_SEARCH_ROUTES.public} onClick={onClose}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [tabletSearchOpen, setTabletSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabletSearchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, initializing } = useAuth();
  const isAuthed = !initializing && !!user;
  const accountLabel = user?.displayName ?? user?.firstName ?? user?.email ?? "Account";

  // Reachable from every page — IndiaMART's search bar isn't confined to the
  // marketplace page body. Hands off to /products, which reads `?q=` reactively
  // (see useUrlSearchQuery), so submitting while already on /products now
  // re-runs the search instead of silently changing the URL.
  const handleSearchSubmit = (q: string) => {
    router.push(buildSearchHref("public", q));
    setSearchQuery("");
  };

  // Close dropdown / tablet search on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (tabletSearchRef.current && !tabletSearchRef.current.contains(e.target as Node)) {
        setTabletSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl"
      style={{ borderBottom: "1px solid var(--border)", backgroundColor: "color-mix(in srgb, var(--background) 82%, transparent)", boxShadow: "0 1px 0 var(--border), 0 6px 24px color-mix(in srgb, var(--primary) 6%, transparent)" }}>
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
              (() => {
                const active = pathname === link.href;
                return (
                  <Link key={link.label} href={link.href}
                    aria-current={active ? "page" : undefined}
                    className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                    style={{
                      color: active ? "var(--primary)" : "var(--foreground)",
                      backgroundColor: active ? "var(--primary-light)" : "transparent",
                    }}>
                    {link.label}
                  </Link>
                );
              })()
            )
          )}
        </nav>

        {/* Global search — reachable from every page, not just the marketplace body.
            Full inline bar only once there's room for it (lg+); the tablet
            range gets a compact icon trigger instead (below). */}
        <SearchBar
          size="sm"
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Search products…"
          className="hidden max-w-xs flex-1 lg:block"
        />

        {/* Tablet-only compact search trigger — md..lg has room for the logo,
            a compact search icon, and auth CTAs, but not the full nav-link
            row + wide search bar, which stay gated to lg. */}
        <div ref={tabletSearchRef} className="relative hidden md:flex lg:hidden">
          <button
            type="button"
            onClick={() => setTabletSearchOpen((v) => !v)}
            aria-label="Search products"
            aria-expanded={tabletSearchOpen}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all hover:bg-[var(--primary-light)]"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <AnimatePresence>
            {tabletSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl p-2"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
              >
                <SearchBar
                  size="md"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={(q) => { setTabletSearchOpen(false); handleSearchSubmit(q); }}
                  placeholder="Search products…"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Auth CTA — moved up to md: with the nav-link row and full search
            bar gated to lg:, there's headroom for it a breakpoint earlier so
            tablet visitors aren't dropped straight to the hamburger. */}
        <div className="hidden items-center gap-3 md:flex">
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
              <Link href="/welcome"
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
            {/* Search is lg-only in the bar above, so mobile gets it here —
                previously there was no way to search from a phone at all. */}
            <SearchBar
              size="md"
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={(q) => { setMobileOpen(false); handleSearchSubmit(q); }}
              placeholder="Search products…"
              className="mb-3"
            />
            <nav className="space-y-1">
              {/* Browse by industry — mirrors the desktop mega-dropdown's
                  structure (full category list + "All products" / "Search
                  products" footer) instead of silently truncating to 8 with
                  no escape hatch. */}
              <div className="rounded-xl pb-2">
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                  Browse by industry
                </p>
                <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto px-1">
                  {CATEGORIES.map((cat) => (
                    <Link key={cat.id} href={getCategoryHref(cat.id)} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-[var(--primary-light)]"
                      style={{ color: "var(--foreground)" }}>
                      <span>{cat.icon}</span>{cat.title}
                    </Link>
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2 px-1 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <Link href="/products" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
                    style={{ color: "var(--primary)" }}>
                    🛍️ All products
                  </Link>
                  <Link href={PRODUCT_SEARCH_ROUTES.public} onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
                    style={{ color: "var(--foreground)" }}>
                    🔍 Search products
                  </Link>
                </div>
              </div>

              {[
                { href: "/shop", label: "Shop" },
                { href: "/about", label: "About" },
                { href: "/support", label: "Support" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--primary-light)]"
                  style={{ color: pathname === l.href ? "var(--primary)" : "var(--foreground)" }}>{l.label}</Link>
              ))}
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
                  <Link href="/welcome" onClick={() => setMobileOpen(false)}
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
