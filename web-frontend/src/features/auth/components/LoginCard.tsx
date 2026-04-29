"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";

type CredentialMode = "email" | "phone";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay, ease: [0.22, 1, 0.36, 1] },
});

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

export const LoginCard = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const identifierValue = credentialMode === "email" ? email : phone;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedIdentifier = identifierValue.trim();
    const trimmedPassword = password.trim();
    if (!trimmedIdentifier || !trimmedPassword) {
      setError("Please fill in your credentials to continue.");
      return;
    }
    try {
      setLoading(true);
      const authenticatedUser =
        credentialMode === "email"
          ? await login({ email: trimmedIdentifier, password: trimmedPassword, remember: true })
          : await login({ phone: trimmedIdentifier, password: trimmedPassword, remember: true });
      router.push(authenticatedUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0.15)}>
        <h1 className="text-[28px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
          Welcome back
        </h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--medium-gray)" }}>
          Sign in to your Manufacture workspace
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Email / Phone toggle with sliding pill ─────────────── */}
        <motion.div {...fadeUp(0.22)}>
          <div
            className="relative flex rounded-xl p-1"
            style={{ backgroundColor: "var(--light-gray)" }}
          >
            {(["email", "phone"] as CredentialMode[]).map((mode) => {
              const isActive = credentialMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCredentialMode(mode)}
                  className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-200"
                  style={{ color: isActive ? "var(--primary)" : "var(--medium-gray)" }}
                >
                  {/* Sliding pill behind the active button */}
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundColor: "var(--surface)",
                        boxShadow: "0 1px 4px rgba(20,141,178,0.12), 0 0 0 1px rgba(20,141,178,0.08)",
                      }}
                      transition={{ type: "spring", stiffness: 600, damping: 38 }}
                    />
                  )}

                  {/* Icon */}
                  <motion.span
                    animate={{ scale: isActive ? 1 : 0.85, opacity: isActive ? 1 : 0.5 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    className="relative z-10"
                  >
                    {mode === "email" ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                        <path d="m2 7 10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="17" r="1" fill="currentColor" />
                      </svg>
                    )}
                  </motion.span>

                  {/* Label */}
                  <span className="relative z-10">{mode === "email" ? "Email" : "Mobile"}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Identifier field with icon + slide transition ───────── */}
        <motion.div {...fadeUp(0.3)}>
          {/* Label */}
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {credentialMode === "email" ? "Email address" : "Mobile number"}
          </p>

          {/* Input — instant swap, no weird slide */}
          <input
            key={credentialMode}
            className="mt-2 w-full rounded-xl border px-4 py-3 text-[15px] transition-[border-color] focus:outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            placeholder={credentialMode === "email" ? "you@company.com" : "+91 98765 43210"}
            value={identifierValue}
            onChange={(e) => credentialMode === "email" ? setEmail(e.target.value) : setPhone(e.target.value)}
            type={credentialMode === "email" ? "email" : "tel"}
            autoComplete={credentialMode === "email" ? "email" : "tel"}
          />
        </motion.div>

        {/* Password field */}
        <motion.div {...fadeUp(0.37)}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div
            className="relative mt-2 flex items-center rounded-xl border transition-colors"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            onFocusCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)")}
            onBlurCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
          >
            <input
              className="w-full bg-transparent px-4 py-3 text-[15px] focus:outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="flex h-full items-center px-4"
              style={{ color: "var(--medium-gray)" }}
              whileTap={{ scale: 0.85 }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={showPassword ? "open" : "closed"}
                  initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
                  transition={{ duration: 0.1 }}
                >
                  <EyeIcon open={showPassword} />
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
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
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div {...fadeUp(0.44)}>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
            whileHover={{ scale: 1.015, boxShadow: "0 6px 20px rgba(213,97,109,0.45)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </motion.svg>
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};
