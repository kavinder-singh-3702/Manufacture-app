"use client";

import { useAuth } from "../../../hooks/useAuth";

export const AuthSummaryCard = () => {
  const { user, initializing, bootstrapError, logout } = useAuth();

  if (initializing) {
    return (
      <div
        className="animate-pulse rounded-3xl p-6 shadow"
        style={{
          border: "1px solid rgba(250, 218, 208, 0.2)",
          backgroundColor: "rgba(26, 36, 64, 0.65)",
        }}
      >
        <div className="h-4 w-32 rounded" style={{ backgroundColor: "rgba(250, 218, 208, 0.25)" }} />
        <div className="mt-3 h-6 w-48 rounded" style={{ backgroundColor: "rgba(250, 218, 208, 0.15)" }} />
        <div className="mt-6 h-10 w-full rounded-full" style={{ backgroundColor: "rgba(250, 218, 208, 0.2)" }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 shadow-xl shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.2)",
        background: "linear-gradient(135deg, rgba(59, 31, 43, 0.65), rgba(26, 36, 64, 0.8))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white"
          style={{ backgroundColor: "rgba(250, 218, 208, 0.3)" }}
        >
          {user?.displayName?.slice(0, 2).toUpperCase() || "MC"}
        </div>
        <div>
          <p
            className="text-sm uppercase tracking-[0.4em]"
            style={{ color: "var(--color-peach)" }}
          >
            Workspace status
          </p>
          <h3 className="text-xl font-semibold text-white">
            {user ? `Hi, ${user.displayName ?? user.email}` : "Guest explorer"}
          </h3>
          <p className="text-sm text-white/70">
            {user ? user.email : "Authenticate to sync with your Manufacture backend."}
          </p>
        </div>
      </div>
      {bootstrapError ? (
        <p
          className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ backgroundColor: "rgba(255, 154, 162, 0.2)", color: "#ff9aa2" }}
        >
          {bootstrapError}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {user ? (
          <button
            onClick={() => logout()}
            className="flex-1 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: "var(--color-plum)", border: "1px solid rgba(250, 218, 208, 0.4)" }}
          >
            Logout
          </button>
        ) : (
          <p className="text-sm text-white/70">
            New profiles stay signed in thanks to secure HTTP-only sessions.
          </p>
        )}
      </div>
    </div>
  );
};
