import Link from "next/link";

export const FooterCTA = () => {
  return (
    <footer
      className="mt-16 rounded-3xl px-6 py-8 text-white shadow-inner"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(26, 36, 64, 0.9)",
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Ready to join?
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Launch your Manufacture workspace today</h3>
          <p className="text-sm text-white/75">
            Join verified exporters and sourcing leaders already onboarding teams across devices.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full px-6 py-3 text-base font-semibold uppercase tracking-wide"
            style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
          >
            Join Now
          </Link>
          <Link
            href="/signin"
            className="rounded-full border px-6 py-3 text-base font-semibold"
            style={{ borderColor: "rgba(250, 218, 208, 0.4)", color: "var(--color-peach)" }}
          >
            Sign In
          </Link>
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/60">
        © {new Date().getFullYear()} Manufacture Command. All rights reserved.
      </div>
    </footer>
  );
};
