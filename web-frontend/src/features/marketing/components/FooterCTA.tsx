import Link from "next/link";

// Pre-footer CTA block — the page renders its own <SiteFooter /> below this.
// Dropped the invented "2h onboarding response" / "14 countries verified"
// stat tiles and feature-chip row (same fabricated-claim issue the hero had)
// in favour of a single clear ask.
export const FooterCTA = () => (
  <section
    className="relative overflow-hidden rounded-3xl px-6 py-12 text-center lg:px-10"
    style={{ background: "var(--gradient-brand-deep)" }}
  >
    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
    <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />

    <div className="relative mx-auto max-w-xl">
      <h3 className="text-2xl font-bold leading-tight text-white md:text-3xl">
        Launch your ARVANN workspace today
      </h3>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/signup"
          className="inline-flex items-center rounded-2xl px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
        >
          Join now →
        </Link>
        <Link
          href="/signin"
          className="inline-flex items-center rounded-2xl px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          Sign in
        </Link>
      </div>
      <p className="mt-6 text-sm text-white/70">
        Need a hand? Email{" "}
        <a href="mailto:support@manufacture.run" className="font-semibold text-white transition-opacity hover:opacity-80">
          support@manufacture.run
        </a>
      </p>
    </div>
  </section>
);
