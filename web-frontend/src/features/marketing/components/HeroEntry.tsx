import Link from "next/link";

export const HeroEntry = () => {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.2)",
        background: "linear-gradient(135deg, var(--color-midnight), var(--color-plum))",
      }}
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: "var(--color-peach)" }}>
          Manufacture Command
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">
          Connect verified sellers, manage sourcing, and accelerate export ops in one trusted workspace.
        </h1>
        <p className="mt-4 text-lg text-white/80">
          The browser-based hub that mirrors our mobile experience—optimized for procurement teams, supply leads, and
          founders who need visibility from anywhere.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
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
            Sign in
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 rounded-l-3xl bg-[radial-gradient(circle_at_center,_rgba(250,218,208,0.35),_transparent_70%)] lg:block" />
    </section>
  );
};
