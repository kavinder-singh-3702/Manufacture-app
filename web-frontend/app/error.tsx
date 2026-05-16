"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

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
          style={{ color: "var(--danger-strong)" }}
        >
          Something broke
        </p>
        <h1 className="mt-2 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          We hit an unexpected error
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--medium-gray)" }}>
          The team has been notified. You can try again or head back to the home page.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[11px] font-mono" style={{ color: "var(--medium-gray)" }}>
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border px-5 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
