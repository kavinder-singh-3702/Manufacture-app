"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "../../../lib/api-error";
import { authService } from "../../../services/auth";
import { useAuth } from "../../../hooks/useAuth";

export const ResetPasswordCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paramToken = searchParams.get("token");
    if (paramToken) {
      setToken(paramToken);
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const trimmedToken = token.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedToken) {
      setError("Paste the reset token we sent you.");
      return;
    }
    if (trimmedPassword.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resetPassword({ token: trimmedToken, password: trimmedPassword });
      setUser(response.user);
      setStatus("Password updated. Redirecting to your workspace…");
      router.push(response.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to reset password";
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
            New password
          </p>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">Secure your account</h3>
          <p className="text-sm text-[var(--foreground)]">Paste your reset token and set a fresh password.</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
        >
          Step 2
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold" style={{ color: "var(--primary)" }}>
          Reset token
          <textarea
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--medium-gray)] focus:outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "white" }}
            placeholder="Paste the reset token from email or SMS"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            rows={2}
          />
        </label>

        <label className="block text-sm font-semibold" style={{ color: "var(--primary)" }}>
          New password
          <div
            className="mt-2 flex items-center rounded-2xl border px-4"
            style={{ borderColor: "var(--border)", backgroundColor: "white" }}
          >
            <input
              className="w-full bg-transparent py-3 text-base text-[var(--foreground)] placeholder:text-[var(--medium-gray)] focus:outline-none"
              placeholder="Create a new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-sm font-semibold"
              style={{ color: "var(--primary)" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="block text-sm font-semibold" style={{ color: "var(--primary)" }}>
          Confirm password
          <div
            className="mt-2 flex items-center rounded-2xl border px-4"
            style={{ borderColor: "var(--border)", backgroundColor: "white" }}
          >
            <input
              className="w-full bg-transparent py-3 text-base text-[var(--foreground)] placeholder:text-[var(--medium-gray)] focus:outline-none"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="text-sm font-semibold"
              style={{ color: "var(--primary)" }}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {status ? (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--background)", color: "var(--primary)" }}
          >
            {status}
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
          {loading ? "Resetting…" : "Reset password"}
        </button>

        <p className="text-center text-xs text-[var(--foreground)]">
          Need a token?{" "}
          <Link href="/forgot-password" className="font-semibold" style={{ color: "var(--primary)" }}>
            Request reset instructions
          </Link>
        </p>
      </form>
    </div>
  );
};
