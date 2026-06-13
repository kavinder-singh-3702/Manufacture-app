"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useDashboardContext } from "./context";

// ── Animation helpers ─────────────────────────────────────────────────────────

const fade = (delay = 0, y = 16) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] },
});

// ── Quick actions ─────────────────────────────────────────────────────────────
// "soon" set to false for features we've now built

const QUICK_ACTIONS = [
  { label: "Inventory",  icon: "📦", href: "/dashboard/inventory",  gradient: "from-[#148DB2] to-[#1DA8D4]", shadow: "rgba(20,141,178,0.30)", soon: false },
  { label: "Products",   icon: "🏷️", href: "/dashboard/products",   gradient: "from-[#D5616D] to-[#E87B85]", shadow: "rgba(213,97,109,0.30)", soon: false },
  { label: "Quotes",     icon: "📋", href: "/dashboard/quotes",     gradient: "from-[#7C3AED] to-[#9D5CF0]", shadow: "rgba(124,58,237,0.25)", soon: false },
  { label: "Services",   icon: "🛠️", href: "/dashboard/services",   gradient: "from-[#059669] to-[#10B981]", shadow: "rgba(5,150,105,0.25)",  soon: false },
  { label: "Chat",       icon: "💬", href: "/dashboard/chat",       gradient: "from-[#D97706] to-[#F59E0B]", shadow: "rgba(217,119,6,0.25)",  soon: false },
  { label: "Accounting", icon: "📊", href: "/dashboard/accounting", gradient: "from-[#4F46E5] to-[#6366F1]", shadow: "rgba(79,70,229,0.25)",  soon: false },
] as const;

// ── Industry categories ───────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "food-beverage-manufacturing",          title: "Food & Beverage",   icon: "🍚", bg: "#FEF3C7", text: "#92400E" },
  { id: "textile-apparel-manufacturing",        title: "Textile & Apparel", icon: "👕", bg: "#F3E8FF", text: "#6D28D9" },
  { id: "paper-packaging-industry",             title: "Paper & Pack",      icon: "📦", bg: "#E0F2FE", text: "#0369A1" },
  { id: "chemical-manufacturing",               title: "Chemicals",         icon: "⚗️", bg: "#FFE4E6", text: "#9F1239" },
  { id: "pharmaceutical-medical",               title: "Pharma",            icon: "💊", bg: "#E0E7FF", text: "#3730A3" },
  { id: "plastic-polymer-industry",             title: "Plastics",          icon: "🧴", bg: "#DCFCE7", text: "#166534" },
  { id: "rubber-industry",                      title: "Rubber",            icon: "🛞", bg: "#FFF7ED", text: "#9A3412" },
  { id: "metal-steel-industry",                 title: "Metal & Steel",     icon: "🏗️", bg: "#F1F5F9", text: "#334155" },
  { id: "automobile-auto-components",           title: "Automobile",        icon: "🚗", bg: "#FEE2E2", text: "#B91C1C" },
  { id: "electrical-electronics-manufacturing", title: "Electronics",       icon: "🔌", bg: "#DBEAFE", text: "#1D4ED8" },
  { id: "machinery-heavy-engineering",          title: "Machinery",         icon: "⚙️", bg: "#EDE9FE", text: "#6D28D9" },
  { id: "wood-furniture-industry",              title: "Wood & Furniture",  icon: "🪑", bg: "#FEF9C3", text: "#713F12" },
  { id: "construction-material-industry",       title: "Construction",      icon: "🧱", bg: "#FFEDD5", text: "#9A3412" },
  { id: "consumer-goods-fmcg",                  title: "Consumer Goods",    icon: "🧼", bg: "#ECFDF5", text: "#065F46" },
  { id: "defence-aerospace-manufacturing",      title: "Aerospace",         icon: "✈️", bg: "#E0F2FE", text: "#0369A1" },
  { id: "handicrafts-cottage-industries",       title: "Handicrafts",       icon: "🧶", bg: "#FFF7ED", text: "#9A3412" },
] as const;

// ── Stat icon SVGs ────────────────────────────────────────────────────────────

const STAT_ICONS = [
  <svg key="co" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="li" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" /><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" /></svg>,
  <svg key="sh" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
];

const STAT_COLORS = [
  { bg: "#E8F6FB", text: "#148DB2" },
  { bg: "#EDE9FE", text: "#7C3AED" },
  { bg: "#DCFCE7", text: "#059669" },
];

// ── Welcome Hero ──────────────────────────────────────────────────────────────

function WelcomeHero({ name, companyName, isVerified, onVerify }: {
  name?: string; companyName?: string; isVerified: boolean; onVerify?: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.div {...fade(0)}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8"
      style={{ background: "var(--gradient-brand-deep)" }}>
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
      <div className="pointer-events-none absolute -bottom-6 right-24 h-28 w-28 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />
      <div className="pointer-events-none absolute bottom-4 right-8 h-16 w-16 rounded-full opacity-[0.05]" style={{ backgroundColor: "#fff" }} />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">{greeting}</p>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Welcome back, {name ?? "there"} 👋
          </h2>
          {companyName && (
            <p className="text-sm text-white/70">
              Managing <span className="font-semibold text-white">{companyName}</span>
            </p>
          )}
          {/* Verification badge inline */}
          {isVerified ? (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: "rgba(16,185,129,0.25)", color: "#6EE7B7", border: "1px solid rgba(110,231,183,0.4)" }}>
              ✓ Verified company
            </motion.span>
          ) : (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              onClick={onVerify} type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(251,191,36,0.25)", color: "#FCD34D", border: "1px solid rgba(252,211,77,0.4)" }}>
              ⚡ Get verified — unlock more deals
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/company"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Company
          </Link>
          <Link href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#D5616D", boxShadow: "0 4px 14px rgba(213,97,109,0.40)" }}>
            My Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Verification Benefits Banner ──────────────────────────────────────────────

const VERIFICATION_BENEFITS = [
  { icon: "🔍", title: "Priority search ranking", desc: "Appear at the top of buyer searches and category pages." },
  { icon: "📋", title: "Private RFQ access",      desc: "Receive exclusive quote requests from enterprise buyers." },
  { icon: "🛡️", title: "Verified trust badge",    desc: "Badge on your profile, products, and every proposal you send." },
  { icon: "🤝", title: "Direct buyer trust",       desc: "Close deals faster — verified sellers get higher response rates." },
] as const;

const STATUS_META = {
  verified:   { color: "#059669", bg: "#DCFCE7", label: "Verified ✓",        icon: "✅" },
  pending:    { color: "#D97706", bg: "#FEF3C7", label: "Under review…",     icon: "⏳" },
  rejected:   { color: "#DC2626", bg: "#FEE2E2", label: "Needs attention",   icon: "⚠️" },
  unverified: { color: "#7C3AED", bg: "#EDE9FE", label: "Not verified",      icon: "🔒" },
};

function VerificationBanner({ status, onVerify }: {
  status: "verified" | "pending" | "rejected" | "unverified";
  onVerify?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const meta = STATUS_META[status];
  const isVerified = status === "verified";
  const isPending  = status === "pending";

  if (isVerified) {
    return (
      <motion.div {...fade(0.12)}
        className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: "linear-gradient(135deg, #DCFCE7 0%, #D1FAE5 100%)", border: "1px solid #6EE7B7" }}>
        <div className="flex items-center gap-4">
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: "#A7F3D0" }}>
            ✅
          </motion.div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#059669" }}>Compliance</p>
            <p className="text-lg font-bold" style={{ color: "#064E3B" }}>Your company is verified</p>
            <p className="text-xs" style={{ color: "#065F46" }}>
              You have access to private RFQs, priority search ranking, and your trust badge is active.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...fade(0.12)}
      className="relative overflow-hidden rounded-3xl"
      style={{ border: "1px solid rgba(124,58,237,0.2)" }}>
      {/* Gradient background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #F0FDF4 100%)" }} />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={shouldReduceMotion ? {} : isPending ? { opacity: [1, 0.5, 1] } : { y: [0, -3, 0] }}
              transition={{ duration: isPending ? 1.5 : 2, repeat: Infinity, repeatDelay: isPending ? 0 : 3 }}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: meta.bg }}>
              {meta.icon}
            </motion.div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: meta.color }}>
                Company verification
              </p>
              <p className="text-lg font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                {isPending ? "Review in progress" : status === "rejected" ? "Resubmit documents" : "Get your verified badge"}
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
        </div>

        {/* Status message */}
        {isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <div className="flex-shrink-0">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#D97706" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
            </div>
            <p className="text-xs font-semibold" style={{ color: "#92400E" }}>
              Our compliance team is reviewing your submission. You'll receive an email update within 2–3 business days.
            </p>
          </motion.div>
        )}

        {status === "rejected" && (
          <div className="mt-4 rounded-2xl px-4 py-3" style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5" }}>
            <p className="text-xs font-semibold" style={{ color: "#991B1B" }}>
              Your last submission was not approved. Review the feedback in the Compliance section below and resubmit.
            </p>
          </div>
        )}

        {/* Benefits grid */}
        {!isPending && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VERIFICATION_BENEFITS.map((b, i) => (
              <motion.div key={b.title} {...fade(0.18 + i * 0.06)} whileHover={{ y: -2 }}
                className="rounded-2xl p-3.5"
                style={{ backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid rgba(124,58,237,0.12)" }}>
                <span className="text-xl">{b.icon}</span>
                <p className="mt-2 text-xs font-bold" style={{ color: "var(--foreground)" }}>{b.title}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: "var(--medium-gray)" }}>{b.desc}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        {!isPending && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <motion.button
              type="button" onClick={onVerify}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-opacity"
              style={{ backgroundColor: "#7C3AED", boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {status === "rejected" ? "Resubmit documents" : "Earn the verified badge"}
            </motion.button>
            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
              Upload GST certificate + Aadhaar · Takes under 3 minutes
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main OverviewSection ──────────────────────────────────────────────────────

export const OverviewSection = ({
  cards,
}: {
  cards: { label: string; value: string; detail: string }[];
}) => {
  const { user, activeCompany, openVerificationModal } = useDashboardContext();
  const firstName = user.firstName ?? user.displayName?.split(" ")[0];

  // Derive verification status from company compliance
  const complianceRaw = (activeCompany?.complianceStatus ?? "").toLowerCase();
  const verificationStatus: "verified" | "pending" | "rejected" | "unverified" =
    complianceRaw === "verified" || complianceRaw === "approved" || complianceRaw === "active"
      ? "verified"
      : complianceRaw === "pending"
      ? "pending"
      : complianceRaw === "rejected"
      ? "rejected"
      : "unverified";

  const isVerified = verificationStatus === "verified";

  return (
    <div className="space-y-7">
      {/* ── Welcome hero ─────────────────────────────────────────────────── */}
      <WelcomeHero
        name={firstName}
        companyName={activeCompany?.displayName}
        isVerified={isVerified}
        onVerify={openVerificationModal}
      />

      {/* ── Verification section ─────────────────────────────────────────── */}
      <VerificationBanner status={verificationStatus} onVerify={openVerificationModal} />

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div key={card.label} {...fade(0.05 + i * 0.05)}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: STAT_COLORS[i]?.text ?? "var(--primary)" }} />
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: STAT_COLORS[i]?.text ?? "var(--primary)" }}>
                {card.label}
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: STAT_COLORS[i]?.bg ?? "var(--primary-light)", color: STAT_COLORS[i]?.text ?? "var(--primary)" }}>
                {STAT_ICONS[i]}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold capitalize" style={{ color: "var(--foreground)" }}>{card.value}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{card.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <motion.div {...fade(0.2)}>
        <SectionHeader label="Quick access" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div key={action.label} {...fade(0.2 + i * 0.04)} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}>
              <Link href={action.href}
                className="relative flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-200"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 24px ${action.shadow}`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-sm)"; }}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ${action.gradient}`}
                  style={{ boxShadow: `0 4px 10px ${action.shadow}` }}>
                  {action.icon}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Browse by industry ───────────────────────────────────────────── */}
      <motion.div {...fade(0.3)}>
        <SectionHeader label="Browse by industry" />
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-8">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.id} {...fade(0.3 + i * 0.015)} whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={`/dashboard/products/category/${cat.id}`}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-shadow duration-200 hover:shadow-md"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: cat.bg }}>
                  {cat.icon}
                </span>
                <span className="text-[10px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                  {cat.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Getting started checklist (shown when no active company) ──────── */}
      {!activeCompany && (
        <motion.div {...fade(0.35)}
          className="rounded-3xl p-5"
          style={{ background: "linear-gradient(135deg, #F0F9FF 0%, #EEF2FF 100%)", border: "1px solid rgba(20,141,178,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "var(--primary)" }}>Getting started</p>
          <div className="space-y-2">
            {[
              { done: !!user.displayName, text: "Complete your profile", href: "/dashboard/profile" },
              { done: false,              text: "Create or join a company", href: "/dashboard/company" },
              { done: false,              text: "Add your first product",  href: "/dashboard/products/mine" },
              { done: false,              text: "Get your company verified", href: "#", onClick: openVerificationModal },
            ].map((step) => (
              <div key={step.text} className="flex items-center gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: step.done ? "#DCFCE7" : "var(--border)", color: step.done ? "#059669" : "var(--medium-gray)" }}>
                  {step.done
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <div className="h-2 w-2 rounded-full bg-current opacity-40" />
                  }
                </div>
                <Link href={step.href}
                  onClick={step.onClick ? (e) => { e.preventDefault(); step.onClick?.(); } : undefined}
                  className="text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: step.done ? "var(--medium-gray)" : "var(--foreground)", textDecoration: step.done ? "line-through" : "none" }}>
                  {step.text}
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--medium-gray)" }}>{label}</p>
      <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
    </div>
  );
}
