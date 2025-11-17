"use client";

import { useAuth } from "../../hooks/useAuth";

export const AuthSummaryCard = () => {
  const { user, initializing, bootstrapError, logout } = useAuth();

  if (initializing) {
    return (
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/70 p-6 shadow">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-3 h-6 w-48 rounded bg-slate-200" />
        <div className="mt-6 h-10 w-full rounded-full bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
          {user?.displayName?.slice(0, 2).toUpperCase() || "MC"}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Workspace status</p>
          <h3 className="text-xl font-semibold text-slate-900">
            {user ? `Hi, ${user.displayName ?? user.email}` : "Guest explorer"}
          </h3>
          <p className="text-sm text-slate-500">
            {user ? user.email : "Authenticate to sync with your Manufacture backend."}
          </p>
        </div>
      </div>
      {bootstrapError ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {bootstrapError}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {user ? (
          <button
            onClick={() => logout()}
            className="flex-1 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white"
          >
            Logout
          </button>
        ) : (
          <p className="text-sm text-slate-500">
            New profiles stay signed in thanks to secure HTTP-only sessions.
          </p>
        )}
      </div>
    </div>
  );
};
