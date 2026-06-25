"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MarketingShell, MarketingHero } from "./MarketingShell";

const CHANNELS = [
  {
    icon: "✉️",
    title: "Email support",
    body: "Reach our team for any account, verification, or order question.",
    actionLabel: "support@manufacture.run",
    href: "mailto:support@manufacture.run",
  },
  {
    icon: "💬",
    title: "In-app chat",
    body: "Message sellers and our support team directly from your workspace.",
    actionLabel: "Open chat",
    href: "/dashboard/chat",
  },
  {
    icon: "📞",
    title: "Concierge onboarding",
    body: "Get a guided walkthrough and we'll set your workspace up within 48 hours.",
    actionLabel: "Request a session",
    href: "/contact",
  },
] as const;

const FAQS = [
  {
    q: "How do I get my business verified?",
    a: "Create a workspace, open Company → Verification, and upload your registration and compliance documents. Our team reviews submissions and typically responds within 24–48 hours.",
  },
  {
    q: "How do buyers contact sellers about a product?",
    a: "On any product page you can send an inquiry, start a chat, or call the seller directly. Stock is shown as a status (in stock / out of stock) — buyers reach out to confirm exact quantity and pricing.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes. ARVANN runs on both mobile and web with the same catalog, chat, orders, and inventory kept in sync, so you can switch devices without losing context.",
  },
  {
    q: "What does it cost to get started?",
    a: "Creating a workspace and browsing the verified marketplace is free. You can list products, send inquiries, and manage orders right away.",
  },
  {
    q: "How do I reset my password?",
    a: "Use the “Forgot password” link on the sign-in page. Enter your registered email or mobile number and follow the reset instructions sent to you.",
  },
  {
    q: "Can I manage orders, inventory, and accounting here too?",
    a: "Yes. Beyond the marketplace, your workspace includes orders, inventory, quotes, and accounting modules so you can run daily operations from the same place you sell.",
  },
] as const;

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl transition-colors"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}>
        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-lg font-light"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SupportPage = () => (
  <MarketingShell>
    <MarketingHero
      eyebrow="Support center"
      title="We're here to help"
      subtitle="Find quick answers, reach the right channel, or talk to our team. Most questions are resolved within 24 hours."
    />

    <div className="mx-auto w-full max-w-[1100px] space-y-16 px-6 pb-20 lg:px-10">
      {/* Channels */}
      <section className="grid gap-4 md:grid-cols-3">
        {CHANNELS.map((c) => (
          <div key={c.title} className="flex flex-col rounded-2xl p-6"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: "var(--primary-light)" }}>{c.icon}</div>
            <h3 className="mt-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>{c.title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{c.body}</p>
            {c.href.startsWith("mailto:") ? (
              <a href={c.href} className="mt-4 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                {c.actionLabel} →
              </a>
            ) : (
              <Link href={c.href} className="mt-4 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                {c.actionLabel} →
              </Link>
            )}
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section>
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>FAQ</p>
          <h2 className="mt-2 text-3xl font-bold" style={{ color: "var(--foreground)" }}>Frequently asked questions</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* Still need help */}
      <section className="rounded-3xl px-6 py-10 text-center lg:px-10"
        style={{ border: "1px solid var(--border)", background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 4%, transparent) 100%)" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Still need a hand?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--medium-gray)" }}>
          Our team responds within 24 hours. Send us the details and we&apos;ll get you sorted.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/contact"
            className="rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            Contact us →
          </Link>
          <a href="mailto:support@manufacture.run"
            className="rounded-2xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
            Email support
          </a>
        </div>
      </section>
    </div>
  </MarketingShell>
);
