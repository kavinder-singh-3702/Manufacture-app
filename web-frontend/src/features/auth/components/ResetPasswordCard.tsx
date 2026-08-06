"use client";

import Link from "next/link";
import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ApiError } from "../../../lib/api-error";
import { authService } from "../../../services/auth";
import { useAuth } from "../../../hooks/useAuth";
import { homePathFor } from "../../../lib/roles";

const CODE_LENGTH = 6;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const ResetPasswordCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  // A link click carries the long-lived token — that's a complete
  // credential on its own, so the code UI is skipped entirely. Everyone
  // else (arriving from ForgotPasswordCard, or a bookmark) types the code.
  const linkToken = searchParams.get("token");
  const isLinkMode = Boolean(linkToken);

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdownMs, setResendCountdownMs] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const paramEmail = searchParams.get("email");
    if (paramEmail) setEmail(paramEmail);
  }, [searchParams]);

  useEffect(() => {
    if (resendCountdownMs <= 0) return undefined;
    const timeout = setTimeout(() => setResendCountdownMs((current) => Math.max(0, current - 1000)), 1000);
    return () => clearTimeout(timeout);
  }, [resendCountdownMs]);

  const canResend = resendCountdownMs <= 0 && !resendLoading;
  const joinedCode = useMemo(() => code.join(""), [code]);

  const handleCodeInput = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setCode((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  // Distributes a pasted/autofilled code across the boxes starting at the
  // box the paste landed in, instead of keeping only the last digit.
  const handleCodePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    setCode((current) => {
      const next = [...current];
      for (let offset = 0; offset < pasted.length && index + offset < CODE_LENGTH; offset += 1) {
        next[index + offset] = pasted[offset];
      }
      return next;
    });
    const lastFilledIndex = Math.min(index + pasted.length, CODE_LENGTH) - 1;
    codeRefs.current[Math.max(lastFilledIndex, 0)]?.focus();
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your account email to resend a code.");
      return;
    }
    try {
      setResendLoading(true);
      setError(null);
      const response = await authService.requestPasswordReset({ email: trimmedEmail });
      setStatus("A fresh code is on its way to your inbox.");
      setResendCountdownMs(response.resendAvailableInMs ?? 0);
      setCode(Array(CODE_LENGTH).fill(""));
      codeRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to resend the code";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!isLinkMode) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("Enter your account email.");
        return;
      }
      if (joinedCode.length < CODE_LENGTH) {
        setError(`Enter the ${CODE_LENGTH}-digit code.`);
        return;
      }
    }

    try {
      setLoading(true);
      const response = isLinkMode
        ? await authService.resetPassword({ token: linkToken as string, password: trimmedPassword })
        : await authService.resetPassword({ email: email.trim(), code: joinedCode, password: trimmedPassword });
      setUser(response.user);
      setStatus("Password updated. Redirecting to your workspace…");
      router.refresh();
      router.replace(homePathFor(response.user));
    } catch (err) {
      const status = err instanceof ApiError ? err.status : null;
      if (status === 410) {
        setError("That code expired. Request a fresh one below.");
        setCode(Array(CODE_LENGTH).fill(""));
      } else if (status === 429) {
        setError("Too many incorrect attempts. Request a fresh code below.");
        setCode(Array(CODE_LENGTH).fill(""));
      } else {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to reset password";
        setError(message);
      }
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
            New password
          </p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            Secure your account
          </h1>
          <p className="mt-1.5 text-[15px]" style={{ color: "var(--medium-gray)" }}>
            {isLinkMode
              ? "You're resetting via your emailed link — just choose a new password."
              : "Enter the code we emailed you, then choose a new password."}
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {!isLinkMode ? (
          <>
            <motion.div {...fadeUp(0.16)}>
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
              />
            </motion.div>

            <motion.div {...fadeUp(0.22)}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Reset code
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend}
                  className="text-xs font-semibold transition-opacity disabled:opacity-50"
                  style={{ color: "var(--primary)" }}
                >
                  {canResend ? (resendLoading ? "Sending…" : "Resend code") : `Resend in ${formatCountdown(resendCountdownMs)}`}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2.5">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      codeRefs.current[index] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={index === 0}
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(event) => handleCodeInput(index, event.target.value)}
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                    onPaste={(event) => handleCodePaste(index, event)}
                    className="h-14 w-11 rounded-2xl text-center text-xl font-bold focus:outline-none transition-all"
                    style={{
                      border: `2px solid ${digit ? "var(--primary)" : "var(--border)"}`,
                      backgroundColor: digit ? "var(--primary-light)" : "var(--surface)",
                      color: "var(--foreground)",
                      boxShadow: digit ? "var(--shadow-primary)" : "none",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </>
        ) : null}

        <motion.div {...fadeUp(0.3)}>
          <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            New password
          </label>
          <div
            className="relative mt-2 flex items-center rounded-xl border transition-colors"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            onFocusCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)")}
            onBlurCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
          >
            <input
              className="w-full bg-transparent px-4 py-3 text-[15px] focus:outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="flex h-full items-center px-4"
              style={{ color: "var(--medium-gray)" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.36)}>
          <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Confirm password
          </label>
          <div
            className="relative mt-2 flex items-center rounded-xl border transition-colors"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            onFocusCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)")}
            onBlurCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
          >
            <input
              className="w-full bg-transparent px-4 py-3 text-[15px] focus:outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="flex h-full items-center px-4"
              style={{ color: "var(--medium-gray)" }}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {status ? (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)" }}
            >
              {status}
            </motion.div>
          ) : null}
        </AnimatePresence>

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

        <motion.div {...fadeUp(0.44)}>
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
                Resetting…
              </span>
            ) : (
              "Reset password"
            )}
          </motion.button>
        </motion.div>

        <p className="text-center text-xs" style={{ color: "var(--medium-gray)" }}>
          Need a new code?{" "}
          <Link href="/forgot-password" className="font-semibold" style={{ color: "var(--primary)" }}>
            Request reset instructions
          </Link>
        </p>
      </form>
    </div>
  );
};
