import Link from "next/link";
import { MarketingShell, MarketingHero } from "./MarketingShell";

const STATS = [
  { value: "16+", label: "Industries covered" },
  { value: "14", label: "Countries verified" },
  { value: "48h", label: "Concierge onboarding" },
  { value: "1", label: "Workspace for it all" },
] as const;

const VALUES = [
  {
    icon: "🔍",
    title: "Verification first",
    body: "Every seller passes document and compliance checks before they reach buyers, so sourcing starts on trust.",
  },
  {
    icon: "⚡",
    title: "Built for speed",
    body: "RFQs, samples, and approvals move through clear lanes with owners and timelines — nothing slips.",
  },
  {
    icon: "📱",
    title: "Web + mobile parity",
    body: "The same catalog, chat, and orders sync across our app and web console so your team never loses context.",
  },
  {
    icon: "🛡️",
    title: "Security by default",
    body: "Documents, verifications, and audit events live in one secure vault with role-aware sharing.",
  },
  {
    icon: "🤝",
    title: "Made for manufacturers",
    body: "Designed around how Indian manufacturers actually buy, sell, and run operations day to day.",
  },
  {
    icon: "🌱",
    title: "Growing together",
    body: "We ship continuously with our community of exporters and sourcing leaders shaping the roadmap.",
  },
] as const;

export const AboutPage = () => (
  <MarketingShell>
    <MarketingHero
      badge="Platform live · India"
      eyebrow="About ARVANN"
      title="The command center for Indian manufacturing"
      subtitle="ARVANN connects verified manufacturers, suppliers, and buyers in one workspace — managing sourcing, compliance, and partner communication from a single pane of glass."
    />

    <div className="mx-auto w-full max-w-[1100px] space-y-16 px-6 pb-20 lg:px-10">
      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl p-5 text-center"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
            <p className="text-3xl font-black" style={{ color: "var(--primary)" }}>{s.value}</p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>Our mission</p>
          <h2 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            Make trusted manufacturing trade effortless
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            Sourcing in manufacturing is still run on scattered spreadsheets, endless calls, and unverified leads.
            ARVANN brings the whole journey — discovery, verification, quoting, ordering, and after-sales — into one
            place, so buyers can find the right partners faster and sellers can grow with credibility.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            We pair a verified marketplace with operational tooling — inventory, orders, accounting, and chat — so a
            business can run its day from the same workspace it sells in.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/products"
              className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              Explore the marketplace →
            </Link>
            <Link href="/signup"
              className="rounded-2xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
              Create a workspace
            </Link>
          </div>
        </div>
        <div className="rounded-3xl p-7"
          style={{ border: "1px solid var(--border)", background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 5%, transparent) 100%)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>What we run on</p>
          <ul className="mt-4 space-y-3">
            {["Verified seller network", "Buyer ↔ seller chat & quotes", "Orders, inventory & accounting", "Compliance & audit vault"].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--primary)" }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section>
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>What we value</p>
          <h2 className="mt-2 text-3xl font-bold" style={{ color: "var(--foreground)" }}>Principles behind the platform</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl p-6 transition-shadow hover:shadow-lg"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: "var(--primary-light)" }}>{v.icon}</div>
              <h3 className="mt-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl px-6 py-10 text-center lg:px-10"
        style={{ border: "1px solid var(--border)", background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 4%, transparent) 100%)" }}>
        <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
          Ready to build with ARVANN?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--medium-gray)" }}>
          Join verified exporters and sourcing leaders already onboarding teams across devices.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/signup"
            className="rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            Get started free →
          </Link>
          <Link href="/contact"
            className="rounded-2xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
            Talk to us
          </Link>
        </div>
      </section>
    </div>
  </MarketingShell>
);
