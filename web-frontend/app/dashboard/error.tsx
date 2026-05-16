"use client";

import { useEffect } from "react";

export default function DashboardError({
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
    <div className="flex h-full items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-3xl border p-6 text-center shadow-sm"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: "var(--danger-strong)" }}
        >
          Section unavailable
        </p>
        <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          Couldn&apos;t load this view
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--medium-gray)" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
