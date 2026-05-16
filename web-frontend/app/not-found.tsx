import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl border p-8 text-center shadow-sm"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: "var(--primary)" }}
        >
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          Page not found
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--medium-gray)" }}>
          The page you&apos;re looking for may have moved or never existed.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border px-5 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
