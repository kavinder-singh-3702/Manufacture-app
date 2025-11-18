import Link from "next/link";

export const HeroEntry = () => {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-8 shadow-2xl"
      style={{
        border: "1px solid var(--border-soft)",
        background: "linear-gradient(125deg, var(--color-cream), rgba(246, 184, 168, 0.6))",
        color: "var(--foreground)",
        boxShadow: "0 30px 65px rgba(90, 48, 66, 0.16)",
      }}
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: "var(--color-plum)" }}>
          Manufacture Command
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#2e1f2c]">
          Connect verified sellers, manage sourcing, and accelerate export ops in one trusted workspace.
        </h1>
        <p className="mt-4 text-lg text-[#5c4451]">
          The browser-based hub that mirrors our mobile experience—optimized for procurement teams, supply leads, and
          founders who need visibility from anywhere.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-full px-6 py-3 text-base font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: "var(--color-plum)",
              color: "white",
              boxShadow: "0 15px 30px rgba(90, 48, 66, 0.25)",
            }}
          >
            Join Now
          </Link>
          <Link
            href="/signin"
            className="rounded-full border px-6 py-3 text-base font-semibold"
            style={{ borderColor: "var(--border-soft)", color: "var(--color-plum)", backgroundColor: "rgba(255,255,255,0.8)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 rounded-l-3xl bg-[radial-gradient(circle_at_center,_rgba(246,184,168,0.55),_transparent_70%)] lg:block" />
    </section>
  );
};
