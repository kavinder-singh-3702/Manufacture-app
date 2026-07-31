"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BUSINESS_ACCOUNT_TYPES, BusinessAccountType } from "../../../constants/business";
import { PRODUCT_CATEGORIES } from "../../product/utils/categories";
import { authService } from "../../../services/auth";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";
import { useAuthFlow } from "../flow/useAuthFlow";
import { Field, fieldInputClass, fieldInputStyle } from "@/src/components/ui/FormField";

// 5-step wizard mirroring the app's SignupScreen exactly: identity (first +
// last name + email) -> otp -> contact (phone, its own step) -> password ->
// business (DOB, account type, company + categories). See
// app-frontend/src/screens/auth/SignupScreen.tsx#L38 for the source shape.
const STEPS = ["Identity", "Verify", "Contact", "Password", "Business"] as const;
type SignupStep = (typeof STEPS)[number];

const OTP_LENGTH = 6;

type IdentityState = { firstName: string; lastName: string; email: string };
type ContactState = { phone: string };
type PasswordState = { password: string };
type BusinessState = { dateOfBirth: string; accountType: BusinessAccountType; companyName: string; categories: string[] };
type FieldErrors<T> = Partial<Record<keyof T, string>>;

const ACCOUNT_TYPE_META = {
  normal: { icon: "👤", label: "Buyer", desc: "Purchase from manufacturers & traders" },
  trader: { icon: "🏪", label: "Trader", desc: "Buy & resell manufactured goods" },
  manufacturer: { icon: "🏭", label: "Manufacturer", desc: "List your production capacity" },
} as const;

// Matches the app's composeFullName (SignupScreen.tsx#L150-151) — the
// backend's signup endpoints only ever accept one combined `fullName`, so
// the first/last split stays purely a UI convenience.
const composeFullName = (firstName: string, lastName: string) => [firstName, lastName].filter(Boolean).join(" ").trim();

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 1)}${"*".repeat(Math.max(name.length - 1, 3))}@${domain}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.22 },
};

export const SignupCard = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const { go } = useAuthFlow();
  const [step, setStep] = useState<SignupStep>("Identity");
  const [identity, setIdentity] = useState<IdentityState>({ firstName: "", lastName: "", email: "" });
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [contact, setContact] = useState<ContactState>({ phone: "" });
  const [passwordState, setPasswordState] = useState<PasswordState>({ password: "" });
  const [business, setBusiness] = useState<BusinessState>({ dateOfBirth: "", accountType: "normal", companyName: "", categories: [] });
  const [categoryQuery, setCategoryQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [identityErrors, setIdentityErrors] = useState<FieldErrors<IdentityState>>({});
  const [contactErrors, setContactErrors] = useState<FieldErrors<ContactState>>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors<PasswordState>>({});
  const [businessErrors, setBusinessErrors] = useState<FieldErrors<BusinessState>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const stepIndex = STEPS.indexOf(step);
  const requiresCompany = business.accountType !== "normal";

  const reset = () => {
    setStep("Identity");
    setIdentity({ firstName: "", lastName: "", email: "" });
    setOtp(Array(OTP_LENGTH).fill(""));
    setContact({ phone: "" });
    setPasswordState({ password: "" });
    setBusiness({ dateOfBirth: "", accountType: "normal", companyName: "", categories: [] });
    setCategoryQuery("");
    setIdentityErrors({});
    setContactErrors({});
    setPasswordErrors({});
    setBusinessErrors({});
    setStatus(null);
    setError(null);
    setExpiresInMs(null);
  };

  // Step 0's back leaves the flow (-> sign-in) after clearing the form, like
  // SignupScreen's handleBack at stepIndex 0. Any later step just steps back.
  const handleBack = () => {
    if (stepIndex === 0) {
      reset();
      go("login");
      return;
    }
    setStep(STEPS[stepIndex - 1]!);
    setError(null);
  };

  const validateIdentity = () => {
    const errs: FieldErrors<IdentityState> = {};
    if (!identity.firstName.trim() || identity.firstName.trim().length < 2) errs.firstName = "Use at least 2 characters";
    if (!identity.email.trim() || !/^\S+@\S+\.\S+$/.test(identity.email)) errs.email = "Enter a valid email";
    setIdentityErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateContact = () => {
    const errs: FieldErrors<ContactState> = {};
    if (!contact.phone.trim() || !/^[0-9+]{7,15}$/.test(contact.phone.trim())) errs.phone = "Use 7–15 digits";
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePassword = () => {
    const errs: FieldErrors<PasswordState> = {};
    if (passwordState.password.length < 8) errs.password = "At least 8 characters required";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateBusiness = () => {
    const errs: FieldErrors<BusinessState> = {};
    if (requiresCompany) {
      if (!business.companyName.trim()) errs.companyName = "Company name is required";
      if (!business.categories.length) errs.categories = "Pick at least one category";
    }
    setBusinessErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleIdentitySubmit = async () => {
    if (!validateIdentity()) return;
    try {
      setLoading(true);
      setError(null);
      const fullName = composeFullName(identity.firstName.trim(), identity.lastName.trim());
      const email = identity.email.trim().toLowerCase();
      const res = await authService.signup.start({ fullName, email });
      setExpiresInMs(res.expiresInMs);
      setStatus(`OTP sent to ${maskEmail(email)}. Expires in ${Math.ceil(res.expiresInMs / 60000)} min.`);
      setStep("Verify");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not start signup");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit OTP`);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.signup.verify({ otp: code });
      setStatus("OTP verified. Add your mobile number.");
      setStep("Contact");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!validateContact()) return;
    setLoading(true);
    setError(null);
    try {
      // Best-effort like the app (SignupScreen.tsx#L608-616): a failed save
      // here doesn't block progress — phone still rides along in /complete.
      await authService.signup.contact({ phone: contact.phone.trim() });
    } catch {
      // ignored — carried forward regardless
    }
    setStatus(null);
    setStep("Password");
    setLoading(false);
  };

  const handlePasswordSubmit = () => {
    if (!validatePassword()) return;
    setError(null);
    setStep("Business");
  };

  const handleBusinessSubmit = async () => {
    if (!validateBusiness()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await authService.signup.complete({
        password: passwordState.password,
        accountType: business.accountType,
        companyName: requiresCompany ? business.companyName.trim() : undefined,
        categories: requiresCompany ? business.categories : undefined,
        otp: otp.join("") || undefined,
        fullName: composeFullName(identity.firstName.trim(), identity.lastName.trim()),
        email: identity.email.trim().toLowerCase(),
        phone: contact.phone.trim(),
        dateOfBirth: business.dateOfBirth || undefined,
      });
      setUser(res.user);
      // Return to a gated origin if one was supplied (internal paths only).
      const rawNext = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
      // Trader/manufacturer accounts land on verification next, matching the
      // app's ~100ms auto-redirect to CompanyVerification after signup.
      const destination = res.user.role === "admin" ? "/admin" : requiresCompany ? "/dashboard/verification" : "/dashboard";
      router.push(next ?? destination);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not complete signup");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const toggleCategory = (id: string) =>
    setBusiness((p) => ({ ...p, categories: p.categories.includes(id) ? p.categories.filter((c) => c !== id) : [...p.categories, id] }));

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return PRODUCT_CATEGORIES;
    return PRODUCT_CATEGORIES.filter((c) => c.title.toLowerCase().includes(q));
  }, [categoryQuery]);

  const handleContinue = () => {
    if (step === "Identity") return handleIdentitySubmit();
    if (step === "Verify") return handleOtpSubmit();
    if (step === "Contact") return handleContactSubmit();
    if (step === "Password") return handlePasswordSubmit();
    return handleBusinessSubmit();
  };

  const stepMeta: Record<SignupStep, { heading: string; hint: string; cta: string }> = {
    Identity: { heading: "Create account", hint: "Enter your details to personalize your workspace.", cta: "Continue →" },
    Verify: { heading: "Verify your email", hint: `We sent a code to ${identity.email ? maskEmail(identity.email.trim()) : "your email"}.`, cta: "Verify email →" },
    Contact: { heading: "Add mobile number", hint: "This helps with order coordination and business support.", cta: "Save mobile →" },
    Password: { heading: "Set your password", hint: "Use at least 8 characters.", cta: "Continue →" },
    Business: { heading: "Business details", hint: "Set your account type and business information.", cta: "Create Account" },
  };

  return (
    <div className="w-full rounded-3xl shadow-xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
      {/* Header */}
      <div className="px-7 pb-5 pt-7">
        {/* Step progress */}
        <div className="mb-5 flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = s === step;
            return (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ backgroundColor: done || active ? "var(--primary)" : "var(--border)", scale: active ? 1.15 : 1 }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  >
                    {done ? "✓" : i + 1}
                  </motion.div>
                  <span
                    className="hidden text-[10px] font-semibold sm:block"
                    style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && <motion.div animate={{ backgroundColor: done ? "var(--primary)" : "var(--border)" }} className="mx-1.5 h-px flex-1" />}
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
              {stepMeta[step].heading}
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
              {stepMeta[step].hint}
            </p>
          </div>
          <button
            onClick={handleBack}
            className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}
          >
            ← Back
          </button>
        </div>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
          >
            {status}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Step content */}
      <div className="overflow-hidden px-7 pb-7">
        <AnimatePresence mode="wait">
          {step === "Identity" && (
            <motion.div key="identity" {...fadeSlide} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" error={identityErrors.firstName}>
                  <input
                    autoFocus
                    className={fieldInputClass}
                    style={fieldInputStyle(identityErrors.firstName)}
                    placeholder="First name"
                    value={identity.firstName}
                    onChange={(e) => setIdentity((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    className={fieldInputClass}
                    style={fieldInputStyle()}
                    placeholder="Last name"
                    value={identity.lastName}
                    onChange={(e) => setIdentity((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Email" error={identityErrors.email}>
                <input
                  type="email"
                  className={fieldInputClass}
                  style={fieldInputStyle(identityErrors.email)}
                  placeholder="you@company.com"
                  value={identity.email}
                  onChange={(e) => setIdentity((p) => ({ ...p, email: e.target.value }))}
                />
              </Field>
            </motion.div>
          )}

          {step === "Verify" && (
            <motion.div key="otp" {...fadeSlide} className="space-y-5">
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                Expires in {expiresInMs ? Math.ceil(expiresInMs / 60000) : "a few"} minutes.
              </p>
              <div className="flex items-center justify-center gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    className="h-14 w-11 rounded-2xl text-center text-xl font-bold transition-all focus:outline-none"
                    style={{
                      border: `2px solid ${digit ? "var(--primary)" : "var(--border)"}`,
                      backgroundColor: digit ? "var(--primary-light)" : "var(--surface)",
                      color: "var(--foreground)",
                      boxShadow: digit ? "var(--shadow-primary)" : "none",
                    }}
                  />
                ))}
              </div>
              <button type="button" onClick={reset} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                Didn&apos;t receive it? Start over
              </button>
            </motion.div>
          )}

          {step === "Contact" && (
            <motion.div key="contact" {...fadeSlide} className="space-y-4">
              <Field label="Mobile number" error={contactErrors.phone}>
                <input
                  autoFocus
                  type="tel"
                  className={fieldInputClass}
                  style={fieldInputStyle(contactErrors.phone)}
                  placeholder="+91 98765 43210"
                  value={contact.phone}
                  onChange={(e) => setContact({ phone: e.target.value })}
                />
              </Field>
            </motion.div>
          )}

          {step === "Password" && (
            <motion.div key="password" {...fadeSlide} className="space-y-4">
              <Field label="Password" error={passwordErrors.password}>
                <div className="relative">
                  <input
                    autoFocus
                    type={showPassword ? "text" : "password"}
                    className={fieldInputClass}
                    style={{ ...fieldInputStyle(passwordErrors.password), paddingRight: "4rem" }}
                    placeholder="Create a password"
                    value={passwordState.password}
                    onChange={(e) => setPasswordState({ password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--primary)" }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
            </motion.div>
          )}

          {step === "Business" && (
            <motion.div key="business" {...fadeSlide} className="space-y-5">
              {/* Date of birth (optional) */}
              <Field label="Date of birth (optional)">
                <input
                  type="date"
                  className={fieldInputClass}
                  style={fieldInputStyle()}
                  min="1900-01-01"
                  max={todayIso()}
                  value={business.dateOfBirth}
                  onChange={(e) => setBusiness((p) => ({ ...p, dateOfBirth: e.target.value }))}
                />
              </Field>

              {/* Account type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                  Account type
                </p>
                <div className="grid gap-2">
                  {BUSINESS_ACCOUNT_TYPES.map((t) => {
                    const meta = ACCOUNT_TYPE_META[t];
                    const active = business.accountType === t;
                    return (
                      <motion.button
                        key={t}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setBusiness((p) => ({ ...p, accountType: t }))}
                        className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                        style={{ border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)", backgroundColor: active ? "var(--primary-light)" : "var(--surface)" }}
                      >
                        <span className="flex-shrink-0 text-xl">{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>
                            {meta.label}
                          </p>
                          <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                            {meta.desc}
                          </p>
                        </div>
                        {active && (
                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
                            ✓
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Business fields */}
              {requiresCompany && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Field label="Company name" error={businessErrors.companyName}>
                    <input
                      className={fieldInputClass}
                      style={fieldInputStyle(businessErrors.companyName)}
                      placeholder="Acme Textiles Pvt. Ltd."
                      value={business.companyName}
                      onChange={(e) => setBusiness((p) => ({ ...p, companyName: e.target.value }))}
                    />
                  </Field>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                      Business categories {business.categories.length > 0 && `· ${business.categories.length} selected`}
                    </p>
                    <input
                      type="text"
                      placeholder="Search categories…"
                      value={categoryQuery}
                      onChange={(e) => setCategoryQuery(e.target.value)}
                      className={fieldInputClass}
                      style={fieldInputStyle()}
                    />
                    <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border p-1.5" style={{ borderColor: "var(--border)" }}>
                      {filteredCategories.map((cat) => {
                        const active = business.categories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
                            style={{ backgroundColor: active ? "var(--primary-light)" : "transparent" }}
                          >
                            <span
                              className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2"
                              style={{ borderColor: active ? "var(--primary)" : "var(--border)", backgroundColor: active ? "var(--primary)" : "transparent" }}
                            >
                              {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="text-base">{cat.icon}</span>
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>
                              {cat.title}
                            </span>
                          </button>
                        );
                      })}
                      {filteredCategories.length === 0 && (
                        <p className="p-3 text-center text-xs" style={{ color: "var(--medium-gray)" }}>
                          No categories match &quot;{categoryQuery}&quot;
                        </p>
                      )}
                    </div>
                    {businessErrors.categories && (
                      <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                        {businessErrors.categories}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
              {!requiresCompany && (
                <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                  Normal accounts can start right away. You can add business information later from your workspace.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={loading}
          className="mt-7 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: step === "Business" ? "var(--accent)" : "var(--primary)", boxShadow: step === "Business" ? "var(--shadow-accent)" : "var(--shadow-primary)" }}
        >
          {loading ? "Working…" : stepMeta[step].cta}
        </motion.button>
      </div>
    </div>
  );
};
