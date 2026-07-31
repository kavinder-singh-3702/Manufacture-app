"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiError } from "../../../lib/api-error";
import { authService } from "../../../services/auth";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export const ForgotPasswordCard = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  // Dev/staging only — the backend strips these fields in production, so
  // this panel simply won't render there.
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const expiryMinutes = useMemo(() => {
    if (!expiresInMs) return null;
    return Math.max(1, Math.round(expiresInMs / 60000));
  }, [expiresInMs]);

  const trimmedEmail = email.trim();
  const continueUrl = trimmedEmail ? `/reset-password?email=${encodeURIComponent(trimmedEmail)}` : "/reset-password";
  const prefilledLinkUrl = resetToken ? `/reset-password?token=${encodeURIComponent(resetToken)}` : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setSent(false);
    setResetCode(null);
    setResetToken(null);

    if (!trimmedEmail) {
      setError("Enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.requestPasswordReset({ email: trimmedEmail });
      setStatus(response.message);
      setSent(true);
      setExpiresInMs(response.expiresInMs ?? null);
      setResetCode(response.resetCode ?? null);
      setResetToken(response.resetToken ?? null);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to request password reset";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl p-6 shadow-xl"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <motion.div {...fadeUp(0.1)} className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Reset access
          </p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-[15px]" style={{ color: "var(--medium-gray)" }}>
            Enter your account email and we&apos;ll send a reset code and link.
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <motion.div {...fadeUp(0.18)}>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Account email
          </p>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3 text-[15px] transition-[border-color] focus:outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder="you@company.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            autoFocus
          />
        </motion.div>

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2.5 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {sent && status ? (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.14 }}
              className="overflow-hidden rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)" }}
            >
              <p className="font-semibold">{status}</p>
              {expiryMinutes ? (
                <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
                  Expires in {expiryMinutes} minute{expiryMinutes > 1 ? "s" : ""}.
                </p>
              ) : null}
              <Link
                href={continueUrl}
                className="mt-3 inline-flex items-center text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                Enter your code →
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {resetCode || resetToken ? (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>
              Dev shortcut
            </p>
            {resetCode ? <p className="mt-1 font-mono text-lg tracking-widest">{resetCode}</p> : null}
            <p className="mt-2 text-xs" style={{ color: "var(--medium-gray)" }}>
              Shown only outside production — real users get this via email.
            </p>
            {prefilledLinkUrl ? (
              <Link
                href={prefilledLinkUrl}
                className="mt-3 inline-flex items-center text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                Open reset form with link →
              </Link>
            ) : null}
          </div>
        ) : null}

        <motion.div {...fadeUp(0.26)}>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </motion.svg>
                Sending…
              </span>
            ) : (
              "Send reset instructions"
            )}
          </motion.button>
        </motion.div>

        <p className="text-center text-xs" style={{ color: "var(--medium-gray)" }}>
          Still able to log in?{" "}
          <Link href="/signin" className="font-semibold" style={{ color: "var(--primary)" }}>
            Go back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
};
