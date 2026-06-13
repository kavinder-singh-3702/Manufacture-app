import Link from "next/link";
import { SiteFooter } from "./SiteFooter";

const FEATURE_CHIPS = ["Security-first", "Concierge setup", "Mobile + web parity"] as const;

export const FooterCTA = () => (
  <>
    {/* Pre-footer CTA block */}
    <section
      id="pricing"
      className="rounded-3xl px-6 py-10 lg:px-10"
      style={{
        border: "1px solid var(--border)",
        background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.04) 100%)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Ready to join?
          </p>
          <h3 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            Launch your ARVANN workspace today
          </h3>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
            Join verified exporters and sourcing leaders already onboarding teams across devices.
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURE_CHIPS.map((item) => (
              <span
                key={item}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col gap-4 rounded-3xl p-6"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
            >
              New
            </span>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Workspace concierge: under 48 hours
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-2xl px-6 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
            >
              Join now →
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center rounded-2xl px-6 py-3 text-base font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
            >
              Sign in
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "SLA", value: "2h onboarding response" },
              { label: "Coverage", value: "14 countries verified" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl px-3 py-2.5"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  {stat.label}
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        id="support"
        className="mt-6 rounded-2xl px-4 py-3"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
          Support
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
          Prefer a guided walkthrough? Email{" "}
          <a href="mailto:support@manufacture.run" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--foreground)" }}>
            support@manufacture.run
          </a>{" "}
          and we&apos;ll schedule a session within 24 hours.
        </p>
      </div>
    </section>

    <SiteFooter />
  </>
);
