import Link from "next/link";

export const FooterCTA = () => {
  return (
    <footer
      id="pricing"
      className="mt-16 rounded-3xl px-6 py-8 shadow-inner"
      style={{
        border: "1px solid var(--border-soft)",
        background: "linear-gradient(135deg, #fffdf9, var(--color-linen))",
        color: "var(--foreground)",
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Ready to join?
          </p>
          <h3 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Launch your Manufacture workspace today
          </h3>
          <p className="text-sm text-[#5c4451]">
            Join verified exporters and sourcing leaders already onboarding teams across devices.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Security-first", "Concierge setup", "Mobile + web parity"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-xs font-semibold text-[#5a3042]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--border-soft)] bg-white/80 p-5 shadow-sm shadow-[#5a304215]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-peach)] px-3 py-1 text-[11px] font-semibold text-[var(--color-plum)]">
              New
            </span>
            <p className="text-sm font-semibold text-[#2e1f2c]">Workspace concierge: under 48 hours</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-full px-6 py-3 text-base font-semibold uppercase tracking-wide"
              style={{ backgroundColor: "var(--color-plum)", color: "white", boxShadow: "0 12px 30px rgba(90, 48, 66, 0.2)" }}
            >
              Join Now
            </Link>
            <Link
              href="/signin"
              className="rounded-full border px-6 py-3 text-base font-semibold"
              style={{ borderColor: "var(--border-soft)", color: "var(--color-plum)" }}
            >
              Sign In
            </Link>
          </div>
          <div className="grid gap-2 text-sm text-[#5c4451] md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
                SLA
              </p>
              <p className="text-sm font-semibold text-[#2e1f2c]">2h onboarding response</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
                Coverage
              </p>
              <p className="text-sm font-semibold text-[#2e1f2c]">14 countries verified</p>
            </div>
          </div>
        </div>
      </div>
      <div
        id="support"
        className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-3 text-sm text-[#5c4451] shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
          Support
        </p>
        <p className="text-sm">
          Prefer a guided walkthrough? Email <span className="font-semibold text-[#2e1f2c]">support@manufacture.run</span> and
          we will schedule a session within 24 hours.
        </p>
      </div>
      <div className="mt-8 border-t pt-4 text-xs text-[#7a5d6b]" style={{ borderColor: "var(--border-soft)" }}>
        © {new Date().getFullYear()} Manufacture Command. All rights reserved.
      </div>
    </footer>
  );
};
