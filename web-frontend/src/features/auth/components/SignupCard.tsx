"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES, BusinessAccountType } from "../../../constants/business";
import { authService } from "../../../services/auth";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";

const STEPS = ["Profile", "Verify OTP", "Workspace"] as const;
type SignupStep = (typeof STEPS)[number];

const OTP_LENGTH = 6;

type ProfileState = { fullName: string; email: string; phone: string };
type AccountState = { password: string; accountType: BusinessAccountType; companyName: string; categories: string[] };
type FieldErrors<T> = Partial<Record<keyof T, string>>;

const ACCOUNT_TYPE_META = {
  normal: { icon: "👤", label: "Buyer", desc: "Purchase from manufacturers & traders" },
  trader: { icon: "🏪", label: "Trader", desc: "Buy & resell manufactured goods" },
  manufacturer: { icon: "🏭", label: "Manufacturer", desc: "List your production capacity" },
} as const;

const CAT_ICONS: Record<string, string> = {
  printing: "🖨️", manufacturing: "⚙️", packaging: "📦",
  logistics: "🚚", textiles: "🧵", machinery: "🔩", other: "💼",
};

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "var(--accent)" };
  if (score <= 3) return { score, label: "Fair", color: "#F59E0B" };
  return { score, label: "Strong", color: "var(--color-success)" };
};

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.22 },
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}
    </label>
    {children}
    {error && (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
        {error}
      </motion.p>
    )}
  </div>
);

const inputClass = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(20,141,178,0.25)]";
const inputStyle = (error?: string): React.CSSProperties => ({
  border: `1px solid ${error ? "var(--accent)" : "var(--border)"}`,
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
});

export const SignupCard = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState<SignupStep>("Profile");
  const [profile, setProfile] = useState<ProfileState>({ fullName: "", email: "", phone: "" });
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [account, setAccount] = useState<AccountState>({ password: "", accountType: "normal", companyName: "", categories: [] });
  const [showPassword, setShowPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileState>>({});
  const [accountErrors, setAccountErrors] = useState<FieldErrors<AccountState>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const stepIndex = STEPS.indexOf(step);
  const requiresCompany = account.accountType !== "normal";
  const passwordStrength = getPasswordStrength(account.password);

  const reset = () => {
    setStep("Profile"); setProfile({ fullName: "", email: "", phone: "" });
    setOtp(Array(OTP_LENGTH).fill("")); setAccount({ password: "", accountType: "normal", companyName: "", categories: [] });
    setProfileErrors({}); setAccountErrors({}); setStatus(null); setError(null); setExpiresInMs(null);
  };

  const validateProfile = () => {
    const errs: FieldErrors<ProfileState> = {};
    if (!profile.fullName.trim() || profile.fullName.trim().split(" ").length < 2) errs.fullName = "Enter first and last name";
    if (!profile.email.trim() || !/^\S+@\S+\.\S+$/.test(profile.email)) errs.email = "Enter a valid email";
    if (!profile.phone.trim() || !/^[0-9+]{7,15}$/.test(profile.phone.trim())) errs.phone = "Use 7–15 digits";
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAccount = () => {
    const errs: FieldErrors<AccountState> = {};
    if (account.password.length < 8) errs.password = "At least 8 characters required";
    if (requiresCompany) {
      if (!account.companyName.trim()) errs.companyName = "Company name is required";
      if (!account.categories.length) errs.categories = "Pick at least one category";
    }
    setAccountErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileSubmit = async () => {
    if (!validateProfile()) return;
    try {
      setLoading(true); setError(null);
      const res = await authService.signup.start({ fullName: profile.fullName.trim(), email: profile.email.trim().toLowerCase(), phone: profile.phone.trim() });
      setExpiresInMs(res.expiresInMs);
      setStatus(`OTP sent to ${profile.email}. Expires in ${Math.ceil(res.expiresInMs / 60000)} min.`);
      setStep("Verify OTP");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not start signup");
    } finally { setLoading(false); }
  };

  const handleOtpSubmit = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit OTP`); return; }
    try {
      setLoading(true); setError(null);
      await authService.signup.verify({ otp: code });
      setStatus("OTP verified. Finish your setup.");
      setStep("Workspace");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleAccountSubmit = async () => {
    if (!validateAccount()) return;
    try {
      setLoading(true); setError(null);
      const res = await authService.signup.complete({
        password: account.password, accountType: account.accountType,
        companyName: requiresCompany ? account.companyName.trim() : undefined,
        categories: requiresCompany ? account.categories : undefined,
        otp: otp.join("") || undefined,
        fullName: profile.fullName.trim(), email: profile.email.trim().toLowerCase(), phone: profile.phone.trim(),
      });
      setUser(res.user);
      // Return to a gated origin if one was supplied (internal paths only).
      const rawNext = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
      const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
      router.push(next ?? (res.user.role === "admin" ? "/admin" : "/dashboard"));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not complete signup");
    } finally { setLoading(false); }
  };

  const handleOtpInput = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const toggleCategory = (cat: string) =>
    setAccount((p) => ({ ...p, categories: p.categories.includes(cat) ? p.categories.filter((c) => c !== cat) : [...p.categories, cat] }));

  const handleContinue = () => {
    if (step === "Profile") return handleProfileSubmit();
    if (step === "Verify OTP") return handleOtpSubmit();
    return handleAccountSubmit();
  };

  return (
    <div
      className="w-full rounded-3xl shadow-xl"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
    >
      {/* Header */}
      <div className="px-7 pb-5 pt-7">
        {/* Step progress */}
        <div className="mb-5 flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = s === step;
            return (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      backgroundColor: done || active ? "var(--primary)" : "var(--border)",
                      scale: active ? 1.15 : 1,
                    }}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  >
                    {done ? "✓" : i + 1}
                  </motion.div>
                  <span className="hidden text-[11px] font-semibold sm:block"
                    style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <motion.div
                    animate={{ backgroundColor: done ? "var(--primary)" : "var(--border)" }}
                    className="mx-2 flex-1 h-px"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <h2 className="mt-0.5 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {step === "Profile" ? "Create account" : step === "Verify OTP" ? "Verify your email" : "Set up workspace"}
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
              {step === "Profile" && "Enter your details to personalize your workspace."}
              {step === "Verify OTP" && `We sent a code to ${profile.email || "your email"}.`}
              {step === "Workspace" && "Set your password and business type."}
            </p>
          </div>
          <button onClick={stepIndex === 0 ? reset : () => { setStep(STEPS[stepIndex - 1]!); setError(null); }}
            className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
            {stepIndex === 0 ? "Reset" : "← Back"}
          </button>
        </div>

        {status && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            {status}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            {error}
          </motion.div>
        )}
      </div>

      {/* Step content */}
      <div className="overflow-hidden px-7 pb-7">
        <AnimatePresence mode="wait">
          {step === "Profile" && (
            <motion.div key="profile" {...fadeSlide} className="space-y-4">
              <Field label="Full name" error={profileErrors.fullName}>
                <input autoFocus className={inputClass} style={inputStyle(profileErrors.fullName)}
                  placeholder="First Last" value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
              </Field>
              <Field label="Email" error={profileErrors.email}>
                <input type="email" className={inputClass} style={inputStyle(profileErrors.email)}
                  placeholder="you@company.com" value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
              </Field>
              <Field label="Phone" error={profileErrors.phone}>
                <input type="tel" className={inputClass} style={inputStyle(profileErrors.phone)}
                  placeholder="+91 98765 43210" value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </Field>
            </motion.div>
          )}

          {step === "Verify OTP" && (
            <motion.div key="otp" {...fadeSlide} className="space-y-5">
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                Expires in {expiresInMs ? Math.ceil(expiresInMs / 60000) : "a few"} minutes.
              </p>
              <div className="flex items-center justify-center gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
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
              <button type="button" onClick={reset}
                className="text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}>
                Didn&apos;t receive it? Start over
              </button>
            </motion.div>
          )}

          {step === "Workspace" && (
            <motion.div key="workspace" {...fadeSlide} className="space-y-5">
              {/* Password */}
              <Field label="Password" error={accountErrors.password}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputClass} style={{ ...inputStyle(accountErrors.password), paddingRight: "4rem" }}
                    placeholder="Create a password"
                    value={account.password}
                    onChange={(e) => setAccount((p) => ({ ...p, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--primary)" }}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {account.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{ backgroundColor: i < passwordStrength.score ? passwordStrength.color : "var(--border)" }} />
                      ))}
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </Field>

              {/* Account type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                  Account type
                </p>
                <div className="grid gap-2">
                  {BUSINESS_ACCOUNT_TYPES.map((t) => {
                    const meta = ACCOUNT_TYPE_META[t];
                    const active = account.accountType === t;
                    return (
                      <motion.button key={t} type="button"
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        onClick={() => setAccount((p) => ({ ...p, accountType: t }))}
                        className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                        style={{
                          border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                        }}>
                        <span className="text-xl flex-shrink-0">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>{meta.label}</p>
                          <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{meta.desc}</p>
                        </div>
                        {active && <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
                          style={{ backgroundColor: "var(--primary)" }}>✓</div>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Business fields */}
              {requiresCompany && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Field label="Company name" error={accountErrors.companyName}>
                    <input className={inputClass} style={inputStyle(accountErrors.companyName)}
                      placeholder="Acme Textiles Pvt. Ltd."
                      value={account.companyName}
                      onChange={(e) => setAccount((p) => ({ ...p, companyName: e.target.value }))} />
                  </Field>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                      Business categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BUSINESS_CATEGORIES.map((cat) => {
                        const active = account.categories.includes(cat);
                        return (
                          <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                            style={{
                              border: active ? "none" : "1px solid var(--border)",
                              backgroundColor: active ? "var(--primary)" : "var(--surface)",
                              color: active ? "#fff" : "var(--foreground)",
                            }}>
                            <span>{CAT_ICONS[cat] ?? "🏭"}</span>
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                    {accountErrors.categories && (
                      <p className="mt-1.5 text-xs font-semibold" style={{ color: "var(--accent)" }}>{accountErrors.categories}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={loading}
          className="mt-7 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: step === "Workspace" ? "var(--accent)" : "var(--primary)", boxShadow: step === "Workspace" ? "var(--shadow-accent)" : "var(--shadow-primary)" }}
        >
          {loading ? "Working…" : step === "Workspace" ? "Create my workspace" : step === "Verify OTP" ? "Verify & continue" : "Continue →"}
        </motion.button>
      </div>
    </div>
  );
};
