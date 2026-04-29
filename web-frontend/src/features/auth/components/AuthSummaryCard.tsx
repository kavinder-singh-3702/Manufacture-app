"use client";

import { useAuth } from "../../../hooks/useAuth";

export const AuthSummaryCard = () => {
  const { user, initializing, bootstrapError, logout } = useAuth();

  if (initializing) {
    return (
      <div
        className="animate-pulse rounded-3xl p-6 shadow"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--background)" }} />
        <div className="mt-3 h-6 w-48 rounded" style={{ backgroundColor: "var(--background)" }} />
        <div className="mt-6 h-10 w-full rounded-full" style={{ backgroundColor: "var(--background)" }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 shadow-xl shadow-[rgba(20,141,178,0.15)]"
      style={{
        border: "1px solid var(--border)",
        background: "linear-gradient(135deg, #fffdf9, var(--background))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
        >
          {user?.displayName?.slice(0, 2).toUpperCase() || "MC"}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Workspace status
          </p>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            {user ? `Hi, ${user.displayName ?? user.email}` : "Guest explorer"}
          </h3>
          <p className="text-sm text-[var(--foreground)]">
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
            className="flex-1 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: "var(--primary)",
              border: "1px solid var(--border)",
              color: "white",
              boxShadow: "0 10px 30px rgba(90, 48, 66, 0.25)",
            }}
          >
            Logout
          </button>
        ) : (
          <p className="text-sm text-[var(--foreground)]">
            New profiles stay signed in thanks to secure HTTP-only sessions.
          </p>
        )}
      </div>
    </div>
  );
};
