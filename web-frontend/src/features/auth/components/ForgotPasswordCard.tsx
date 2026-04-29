"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ApiError } from "../../../lib/api-error";
import { authService } from "../../../services/auth";

type IdentifierMode = "email" | "phone";

export const ForgotPasswordCard = () => {
  const [mode, setMode] = useState<IdentifierMode>("email");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const expiryMinutes = useMemo(() => {
    if (!expiresInMs) return null;
    return Math.max(1, Math.round(expiresInMs / 60000));
  }, [expiresInMs]);

  const expiresAtLabel = expiresAt ? new Date(expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
  const prefilledResetUrl = resetToken ? `/reset-password?token=${encodeURIComponent(resetToken)}` : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setResetToken(null);
    setExpiresAt(null);
    setExpiresInMs(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError("Enter your registered email or phone number.");
      return;
    }

    try {
      setLoading(true);
      const response =
        mode === "email"
          ? await authService.requestPasswordReset({ email: trimmedIdentifier })
          : await authService.requestPasswordReset({ phone: trimmedIdentifier });
      setStatus(response.message);
      setExpiresAt(response.expiresAt ?? null);
      setResetToken(response.resetToken ?? null);
      setExpiresInMs(response.expiresInMs ?? null);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to request password reset";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl p-6 shadow-xl shadow-[rgba(20,141,178,0.12)]"
      style={{
        border: "1px solid var(--border)",
        background: "linear-gradient(135deg, #fffdf9, var(--background))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Reset Access
          </p>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">Forgot your password?</h3>
          <p className="text-sm text-[var(--foreground)]">Choose email or mobile and we will send reset instructions.</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
        >
          Secure
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div
          className="flex gap-2 rounded-full p-1 text-sm font-semibold"
          style={{ backgroundColor: "var(--background)" }}
        >
          {(["email", "phone"] as IdentifierMode[]).map((option) => {
            const isActive = mode === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className="flex-1 rounded-full px-3 py-2 transition"
                style={{
                  backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                  color: isActive ? "var(--primary)" : "rgba(46, 44, 51, 0.7)",
                  boxShadow: isActive ? "0 8px 20px rgba(246, 184, 168, 0.4)" : undefined,
                }}
              >
                {option === "email" ? "Email" : "Mobile"}
              </button>
            );
          })}
        </div>

        <label className="block text-sm font-semibold" style={{ color: "var(--primary)" }}>
          {mode === "email" ? "Workspace email" : "Registered mobile number"}
          <input
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--medium-gray)] focus:outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "white" }}
            placeholder={mode === "email" ? "name@company.com" : "+12065550123"}
            type={mode === "email" ? "email" : "tel"}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete={mode === "email" ? "email" : "tel"}
          />
        </label>

        {status ? (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--background)", color: "var(--primary)" }}
          >
            <p>{status}</p>
            <p className="text-xs text-[var(--foreground)]">
              Token stays active for {expiryMinutes ?? "a few"} min{expiryMinutes && expiryMinutes > 1 ? "s" : ""}.
              {expiresAtLabel ? ` Expires ~${expiresAtLabel}.` : ""}
            </p>
          </div>
        ) : null}

        {resetToken ? (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "white", color: "var(--primary)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#a15068" }}>
              Dev shortcut
            </p>
            <p className="mt-1 font-mono text-sm break-all">{resetToken}</p>
            <p className="mt-2 text-xs text-[var(--foreground)]">
              Copy this token to reset now. In production you will receive it via email or SMS.
            </p>
            {prefilledResetUrl ? (
              <Link
                href={prefilledResetUrl}
                className="mt-3 inline-flex items-center text-sm font-semibold"
                style={{ color: "var(--primary)" }}
              >
                Open reset form with token →
              </Link>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="text-sm font-semibold" style={{ color: "#ff9aa2" }}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-full py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
            boxShadow: "0 12px 30px rgba(90, 48, 66, 0.25)",
          }}
          disabled={loading}
        >
          {loading ? "Sending reset…" : "Send reset instructions"}
        </button>

        <p className="text-center text-xs text-[var(--foreground)]">
          Still able to log in?{" "}
          <Link href="/signin" className="font-semibold" style={{ color: "var(--primary)" }}>
            Go back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
};
