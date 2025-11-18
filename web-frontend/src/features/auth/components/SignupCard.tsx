"use client";

import { useState } from "react";
import {
  BUSINESS_ACCOUNT_TYPES,
  BUSINESS_CATEGORIES,
  BusinessAccountType,
} from "../../../constants/business";
import { authService } from "../../../services/auth";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";

const steps = ["profile", "otp", "account"] as const;

type SignupStep = (typeof steps)[number];

type ProfileState = {
  fullName: string;
  email: string;
  phone: string;
};

type AccountState = {
  password: string;
  accountType: BusinessAccountType;
  companyName: string;
  categories: string[];
};

type FieldErrors<T> = Partial<Record<keyof T, string>>;

const initialProfile: ProfileState = {
  fullName: "",
  email: "",
  phone: "",
};

const createAccountState = (): AccountState => ({
  password: "",
  accountType: "normal",
  companyName: "",
  categories: [],
});

const stepTitles: Record<SignupStep, string> = {
  profile: "Create Account",
  otp: "Verify OTP",
  account: "Workspace Setup",
};

const stepDescriptions: Record<SignupStep, string> = {
  profile: "Enter who is leading ops so we can personalize your workspace.",
  otp: "Enter the 4-digit OTP sent to your email / phone.",
  account: "Set your password and tell us about your business.",
};

export const SignupCard = () => {
  const { setUser } = useAuth();
  const [step, setStep] = useState<SignupStep>("profile");
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [otp, setOtp] = useState("");
  const [account, setAccount] = useState<AccountState>(createAccountState());
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileState>>({});
  const [accountErrors, setAccountErrors] = useState<FieldErrors<AccountState>>({});
  const [otpError, setOtpError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);

  const stepIndex = steps.indexOf(step);
  const requiresCompany = account.accountType !== "normal";

  const resetFlow = () => {
    setStep("profile");
    setProfile(initialProfile);
    setOtp("");
    setAccount(createAccountState());
    setProfileErrors({});
    setAccountErrors({});
    setOtpError(null);
    setStatus(null);
    setError(null);
    setExpiresInMs(null);
  };

  const validateProfile = () => {
    const nextErrors: FieldErrors<ProfileState> = {};
    const trimmedName = profile.fullName.trim();
    const trimmedEmail = profile.email.trim().toLowerCase();
    const trimmedPhone = profile.phone.trim();

    if (!trimmedName) {
      nextErrors.fullName = "Please enter your full name";
    } else if (trimmedName.split(" ").length < 2) {
      nextErrors.fullName = "Include both first and last name";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!trimmedPhone) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^[0-9+]{7,15}$/.test(trimmedPhone)) {
      nextErrors.phone = "Use 7-15 digits";
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAccount = () => {
    const nextErrors: FieldErrors<AccountState> = {};
    if (account.password.length < 8) {
      nextErrors.password = "Use at least 8 characters";
    }
    if (requiresCompany) {
      if (!account.companyName.trim()) {
        nextErrors.companyName = "Company name is required";
      }
      if (!account.categories.length) {
        nextErrors.categories = "Select at least one category";
      }
    }
    setAccountErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSubmit = async () => {
    if (!validateProfile()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await authService.signup.start({
        fullName: profile.fullName.trim(),
        email: profile.email.trim().toLowerCase(),
        phone: profile.phone.trim(),
      });
      setStatus(`OTP sent. Expires in ${(response.expiresInMs / 60000).toFixed(0)} min.`);
      setExpiresInMs(response.expiresInMs);
      setStep("otp");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to start signup";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setOtpError("Enter the OTP");
      setError("OTP is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setOtpError(null);
      await authService.signup.verify({ otp: trimmedOtp });
      setStatus("OTP verified. Finish your setup.");
      setStep("account");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to verify OTP";
      setError(message);
      setOtpError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async () => {
    if (!validateAccount()) {
      setError("Complete the required fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        password: account.password,
        accountType: account.accountType,
        companyName: requiresCompany ? account.companyName.trim() : undefined,
        categories: requiresCompany ? account.categories : undefined,
      };
      const response = await authService.signup.complete(payload);
      setStatus("Signup complete! Redirecting...");
      setUser(response.user);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to complete signup";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (step === "profile") return handleProfileSubmit();
    if (step === "otp") return handleOtpSubmit();
    return handleAccountSubmit();
  };

  const toggleCategory = (category: string) => {
    setAccount((prev) => {
      const isSelected = prev.categories.includes(category);
      return {
        ...prev,
        categories: isSelected ? prev.categories.filter((item) => item !== category) : [...prev.categories, category],
      };
    });
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      resetFlow();
      return;
    }
    const previous = steps[stepIndex - 1];
    setStep(previous);
    setError(null);
    setStatus(null);
    setOtpError(null);
    setProfileErrors({});
    setAccountErrors({});
  };

  return (
    <div
      className="rounded-3xl p-6 shadow-xl shadow-black/25"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.2)",
        background: "linear-gradient(135deg, rgba(59, 31, 43, 0.85), rgba(26, 36, 64, 0.9))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.4em]"
            style={{ color: "var(--color-peach)" }}
          >
            Step {stepIndex + 1} of {steps.length}
          </p>
          <h3 className="text-xl font-semibold text-white">{stepTitles[step]}</h3>
          <p className="text-sm text-white/70">{stepDescriptions[step]}</p>
        </div>
        <button
          onClick={handleBack}
          className="text-sm font-semibold transition"
          style={{ color: "var(--color-peach)" }}
        >
          {stepIndex === 0 ? "Reset" : "Back"}
        </button>
      </div>

      {status ? (
        <p
          className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ backgroundColor: "rgba(250, 218, 208, 0.15)", color: "var(--color-peach)" }}
        >
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm font-semibold" style={{ color: "#ff9aa2" }}>
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {step === "profile" ? (
          <div className="space-y-4">
            <InputField
              label="Full name"
              placeholder="Enter Full Name"
              value={profile.fullName}
              onChange={(value) => setProfile((prev) => ({ ...prev, fullName: value }))}
              error={profileErrors.fullName}
            />
            <InputField
              label="Email"
              placeholder="Enter Email Id"
              value={profile.email}
              onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))}
              error={profileErrors.email}
              type="email"
            />
            <InputField
              label="Phone"
              placeholder="Enter Mobile Number"
              value={profile.phone}
              onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))}
              error={profileErrors.phone}
              type="tel"
            />
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              We sent an OTP to {profile.email || "your email"} and {profile.phone || "your phone"}. Expires in{" "}
              {expiresInMs ? Math.ceil(expiresInMs / 60000) : "a few"} minutes.
            </p>
            <InputField
              label="OTP"
              placeholder="Enter OTP"
              value={otp}
              onChange={setOtp}
              error={otpError ?? undefined}
            />
            <button
              onClick={resetFlow}
              className="text-sm font-semibold"
              style={{ color: "var(--color-peach)" }}
            >
              Start over
            </button>
          </div>
        ) : null}

        {step === "account" ? (
          <div className="space-y-5">
            <div className="text-sm font-semibold text-white">
              Create password
              <div
                className="mt-2 flex items-center rounded-2xl border px-4"
                style={{
                  borderColor: accountErrors.password ? "#ff9aa2" : "rgba(250, 218, 208, 0.35)",
                  backgroundColor: "rgba(17, 24, 39, 0.4)",
                }}
              >
                <input
                  className="w-full bg-transparent py-3 text-base text-white placeholder:text-white/60 focus:outline-none"
                  placeholder="Create Password"
                  value={account.password}
                  onChange={(event) => setAccount((prev) => ({ ...prev, password: event.target.value }))}
                  type={showSignupPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword((prev) => !prev)}
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-peach)" }}
                >
                  {showSignupPassword ? "Hide" : "Show"}
                </button>
              </div>
              {accountErrors.password ? (
                <span className="mt-1 block text-sm font-semibold" style={{ color: "#ff9aa2" }}>
                  {accountErrors.password}
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Select account type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BUSINESS_ACCOUNT_TYPES.map((type) => {
                  const isActive = account.accountType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccount((prev) => ({ ...prev, accountType: type }))}
                      className="rounded-full border px-4 py-2 text-sm font-semibold capitalize transition"
                      style={{
                        borderColor: isActive ? "rgba(250, 218, 208, 0.6)" : "rgba(250, 218, 208, 0.25)",
                        backgroundColor: isActive ? "var(--color-peach)" : "transparent",
                        color: isActive ? "var(--color-plum)" : "rgba(255,255,255,0.75)",
                        boxShadow: isActive ? "0 10px 25px rgba(250, 218, 208, 0.35)" : undefined,
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {requiresCompany ? (
              <div className="space-y-5">
                <InputField
                  label="Company name"
                  placeholder="Company Name"
                  value={account.companyName}
                  onChange={(value) => setAccount((prev) => ({ ...prev, companyName: value }))}
                  error={accountErrors.companyName}
                />
                <div>
                  <p className="text-sm font-semibold text-white">Business categories</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {BUSINESS_CATEGORIES.map((category) => {
                      const isSelected = account.categories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="rounded-full border px-4 py-2 text-sm font-semibold capitalize transition"
                          style={{
                            borderColor: isSelected ? "rgba(250, 218, 208, 0.6)" : "rgba(250, 218, 208, 0.25)",
                            backgroundColor: isSelected ? "var(--color-peach)" : "transparent",
                            color: isSelected ? "var(--color-plum)" : "rgba(255,255,255,0.75)",
                          }}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  {accountErrors.categories ? (
                    <p className="mt-2 text-sm font-semibold" style={{ color: "#ff9aa2" }}>
                      {accountErrors.categories}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        onClick={handleContinue}
        className="mt-8 w-full rounded-full py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
        disabled={loading}
      >
        {loading ? "Saving…" : step === "account" ? "Create account" : "Continue"}
      </button>
    </div>
  );
};

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  type?: string;
};

const InputField = ({ label, value, onChange, placeholder, error, type = "text" }: InputFieldProps) => (
  <label className="block text-sm font-semibold" style={{ color: "#fff" }}>
    {label}
    <input
      className="mt-2 w-full rounded-2xl border px-4 py-3 text-base text-white placeholder:text-white/60 focus:outline-none"
      style={{
        borderColor: error ? "#ff9aa2" : "rgba(250, 218, 208, 0.35)",
        backgroundColor: "rgba(17, 24, 39, 0.4)",
      }}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={type}
    />
    {error ? <span className="mt-1 block text-sm font-semibold" style={{ color: "#ff9aa2" }}>{error}</span> : null}
  </label>
);
