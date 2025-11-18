import Link from "next/link";

export const FooterCTA = () => {
  return (
    <footer
      className="mt-16 rounded-3xl px-6 py-8 shadow-inner"
      style={{
        border: "1px solid var(--border-soft)",
        background: "linear-gradient(135deg, #fffdf9, var(--color-linen))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Ready to join?
          </p>
          <h3 className="mt-2 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Launch your Manufacture workspace today
          </h3>
          <p className="text-sm text-[#5c4451]">
            Join verified exporters and sourcing leaders already onboarding teams across devices.
          </p>
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
      </div>
      <div className="mt-8 border-t pt-4 text-xs text-[#7a5d6b]" style={{ borderColor: "var(--border-soft)" }}>
        © {new Date().getFullYear()} Manufacture Command. All rights reserved.
      </div>
    </footer>
  );
};
