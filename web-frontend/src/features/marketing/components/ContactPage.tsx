"use client";

import { useState } from "react";
import { MarketingShell, MarketingHero } from "./MarketingShell";
import { useToast } from "@/src/components/ui/Toast";
import { contactService } from "@/src/services/contact";
import { ApiError } from "@/src/lib/api-error";

const SUPPORT_EMAIL = "support@manufacture.run";

const DETAILS: { icon: string; label: string; value: string; href?: string }[] = [
  { icon: "✉️", label: "Email", value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  { icon: "🕑", label: "Response time", value: "Within 24 hours" },
  { icon: "🌏", label: "Coverage", value: "India · 14 countries verified" },
];

const TOPICS = ["General enquiry", "Sales & onboarding", "Verification help", "Billing", "Report an issue"] as const;

const inputStyle = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
} as const;

export const ContactPage = () => {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Missing details", "Please add your name, email, and a message.");
      return;
    }
    try {
      setSubmitting(true);
      await contactService.create({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        topic,
        message: message.trim(),
      });
      setSent(true);
      toast.success("Message sent", "Thanks for reaching out — we'll get back to you shortly.");
      setName(""); setEmail(""); setCompany(""); setTopic(TOPICS[0]); setMessage("");
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "Please try again.";
      toast.error("Couldn't send message", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Contact us"
        title="Let's talk"
        subtitle="Questions about the platform, onboarding, or a partnership? Send us a note and the right person will get back to you."
      />

      <div className="mx-auto w-full max-w-[1100px] px-6 pb-20 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Form */}
          <form onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl p-6 md:p-8"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Full name *
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={inputStyle} placeholder="Your name" autoComplete="name" />
              </label>
              <label className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Email *
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                  className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={inputStyle} placeholder="name@company.com" autoComplete="email" />
              </label>
            </div>

            <label className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Company <span className="font-normal" style={{ color: "var(--medium-gray)" }}>(optional)</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)}
                className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={inputStyle} placeholder="Company name" autoComplete="organization" />
            </label>

            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Topic</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TOPICS.map((t) => {
                  const active = topic === t;
                  return (
                    <button key={t} type="button" onClick={() => setTopic(t)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                      style={{
                        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                        backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                        color: active ? "var(--primary)" : "var(--medium-gray)",
                      }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Message *
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
                className="mt-1.5 w-full resize-y rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={inputStyle} placeholder="How can we help?" />
            </label>

            <button type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
                  Sending…
                </>
              ) : "Send message →"}
            </button>
            {sent ? (
              <p className="text-center text-xs font-semibold" style={{ color: "var(--success)" }}>
                ✓ Message sent — we&apos;ll reply to your email within 24 hours.
              </p>
            ) : (
              <p className="text-center text-xs" style={{ color: "var(--medium-gray)" }}>
                We typically respond within 24 hours.
              </p>
            )}
          </form>

          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-3 rounded-3xl p-6"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Reach us</p>
              {DETAILS.map((d) => (
                <div key={d.label} className="flex items-start gap-3 rounded-2xl p-3"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: "var(--primary-light)" }}>{d.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>{d.value}</a>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl p-6"
              style={{ border: "1px solid var(--border)", background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 5%, transparent) 100%)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Prefer a guided setup?</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
                Our concierge team can get your workspace live in under 48 hours. Mention &ldquo;onboarding&rdquo; in your message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
};
