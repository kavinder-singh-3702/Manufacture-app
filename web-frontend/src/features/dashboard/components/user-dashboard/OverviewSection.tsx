"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useDashboardContext } from "./context";

const QUICK_ACTIONS = [
  { label: "Inventory",  icon: "📦", href: "/dashboard/inventory",  gradient: "from-[#148DB2] to-[#1DA8D4]",  shadow: "rgba(20,141,178,0.30)" },
  { label: "Products",   icon: "🏷️", href: "/dashboard/products",   gradient: "from-[#D5616D] to-[#E87B85]",  shadow: "rgba(213,97,109,0.30)" },
  { label: "Quotes",     icon: "📋", href: "/dashboard/quotes",     gradient: "from-[#7C3AED] to-[#9D5CF0]",  shadow: "rgba(124,58,237,0.25)" },
  { label: "Services",   icon: "🛠️", href: "/dashboard/services",   gradient: "from-[#059669] to-[#10B981]",  shadow: "rgba(5,150,105,0.25)"  },
  { label: "Chat",       icon: "💬", href: "/dashboard/chat",       gradient: "from-[#D97706] to-[#F59E0B]",  shadow: "rgba(217,119,6,0.25)"  },
  { label: "Accounting", icon: "📊", href: "/dashboard/accounting", gradient: "from-[#4F46E5] to-[#6366F1]",  shadow: "rgba(79,70,229,0.25)"  },
] as const;

const STAT_ICONS = [
  // active company
  <svg key="company" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  // linked companies
  <svg key="linked" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
  // compliance
  <svg key="compliance" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

const STAT_COLORS = [
  { bg: "#E8F6FB", text: "#148DB2" },
  { bg: "#EDE9FE", text: "#7C3AED" },
  { bg: "#DCFCE7", text: "#059669" },
];

const CATEGORIES = [
  { id: "food-beverage-manufacturing",          title: "Food & Beverage",     icon: "🍚", bg: "#FEF3C7" },
  { id: "textile-apparel-manufacturing",        title: "Textile & Apparel",   icon: "👕", bg: "#F3E8FF" },
  { id: "paper-packaging-industry",             title: "Paper & Packaging",   icon: "📦", bg: "#E0F2FE" },
  { id: "chemical-manufacturing",               title: "Chemical",            icon: "⚗️", bg: "#FFE4E6" },
  { id: "pharmaceutical-medical",               title: "Pharma & Medical",    icon: "💊", bg: "#E0E7FF" },
  { id: "plastic-polymer-industry",             title: "Plastic & Polymer",   icon: "🧴", bg: "#DCFCE7" },
  { id: "rubber-industry",                      title: "Rubber",              icon: "🛞", bg: "#FFF7ED" },
  { id: "metal-steel-industry",                 title: "Metal & Steel",       icon: "🏗️", bg: "#E5E7EB" },
  { id: "automobile-auto-components",           title: "Automobile",          icon: "🚗", bg: "#FEE2E2" },
  { id: "electrical-electronics-manufacturing", title: "Electronics",         icon: "🔌", bg: "#DBEAFE" },
  { id: "machinery-heavy-engineering",          title: "Machinery",           icon: "⚙️", bg: "#EDE9FE" },
  { id: "wood-furniture-industry",              title: "Wood & Furniture",    icon: "🪑", bg: "#FEF9C3" },
  { id: "construction-material-industry",       title: "Construction",        icon: "🧱", bg: "#FFEDD5" },
  { id: "consumer-goods-fmcg",                  title: "Consumer Goods",      icon: "🧼", bg: "#ECFDF3" },
  { id: "defence-aerospace-manufacturing",      title: "Defence & Aerospace", icon: "✈️", bg: "#E0F2FE" },
  { id: "handicrafts-cottage-industries",       title: "Handicrafts",         icon: "🧶", bg: "#FFF7ED" },
] as const;

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

function WelcomeHero({ name, companyName }: { name?: string; companyName?: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = name ?? "there";

  return (
    <motion.div
      {...fade(0)}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8"
      style={{
        background: "linear-gradient(135deg, #148DB2 0%, #0F6E8C 50%, #0D5A74 100%)",
      }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
      <div className="pointer-events-none absolute -bottom-6 right-24 h-28 w-28 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />
      <div className="pointer-events-none absolute bottom-4 right-8 h-16 w-16 rounded-full opacity-[0.06]" style={{ backgroundColor: "#fff" }} />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white/70 uppercase tracking-[0.25em]">{greeting}</p>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Welcome back, {displayName} 👋
          </h2>
          {companyName && (
            <p className="text-sm text-white/70">
              You're managing <span className="font-semibold text-white">{companyName}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/company"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            View Company
          </Link>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "#D5616D", color: "#fff", boxShadow: "0 4px 12px rgba(213,97,109,0.40)" }}
          >
            My Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export const OverviewSection = ({
  cards,
}: {
  cards: { label: string; value: string; detail: string }[];
}) => {
  const { user, activeCompany } = useDashboardContext();
  const firstName = user.firstName ?? user.displayName?.split(" ")[0];

  return (
    <div className="space-y-8">
      {/* ── Welcome hero ─────────────────────────────────────────────────── */}
      <WelcomeHero name={firstName} companyName={activeCompany?.displayName} />

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            {...fade(0.05 + i * 0.05)}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
          >
            {/* Colored top accent bar */}
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: STAT_COLORS[i]?.text ?? "#148DB2" }}
            />
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: STAT_COLORS[i]?.text ?? "#148DB2" }}>
                {card.label}
              </p>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: STAT_COLORS[i]?.bg ?? "#E8F6FB", color: STAT_COLORS[i]?.text ?? "#148DB2" }}
              >
                {STAT_ICONS[i]}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {card.value}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
              {card.detail}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <motion.div {...fade(0.2)}>
        <div className="mb-4 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
            Quick actions
          </p>
          <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div key={action.label} {...fade(0.2 + i * 0.04)}>
              <Link
                href={action.href}
                className="flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px ${action.shadow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ${action.gradient}`}
                  style={{ boxShadow: `0 4px 10px ${action.shadow}` }}
                >
                  {action.icon}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                  {action.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Browse by category ───────────────────────────────────────────── */}
      <motion.div {...fade(0.3)}>
        <div className="mb-4 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
            Browse by industry
          </p>
          <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.id}
              {...fade(0.3 + i * 0.02)}
              className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: cat.bg }}
              >
                {cat.icon}
              </span>
              <span className="text-[10px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                {cat.title}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
