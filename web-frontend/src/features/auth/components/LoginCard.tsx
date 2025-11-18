"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";

type CredentialMode = "email" | "phone";

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
      setError("Fill in your credentials to continue");
      return;
    }

    try {
      setLoading(true);
      if (credentialMode === "email") {
        await login({ email: trimmedIdentifier, password: trimmedPassword, remember: true });
      } else {
        await login({ phone: trimmedIdentifier, password: trimmedPassword, remember: true });
      }
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl p-6 shadow-xl shadow-[#5a304230]/20"
      style={{
        border: "1px solid var(--border-soft)",
        background: "linear-gradient(135deg, #fffdf9, var(--color-linen))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Login
          </p>
          <h3 className="text-xl font-semibold text-[#2e1f2c]">Welcome back</h3>
          <p className="text-sm text-[#5c4451]">Use your registered email or phone number.</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
        >
          Ops
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div
          className="flex gap-2 rounded-full p-1 text-sm font-semibold"
          style={{ backgroundColor: "var(--surface-muted)" }}
        >
          {(["email", "phone"] as CredentialMode[]).map((mode) => {
            const isActive = credentialMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setCredentialMode(mode)}
                className="flex-1 rounded-full px-3 py-2 transition"
                style={{
                  backgroundColor: isActive ? "var(--color-peach)" : "transparent",
                  color: isActive ? "var(--color-plum)" : "rgba(46, 44, 51, 0.7)",
                  boxShadow: isActive ? "0 8px 20px rgba(246, 184, 168, 0.4)" : undefined,
                }}
              >
                {mode === "email" ? "Email" : "Mobile"}
              </button>
            );
          })}
        </div>
        <label className="block text-sm font-semibold" style={{ color: "var(--color-plum)" }}>
          {credentialMode === "email" ? "Email address" : "Mobile number"}
          <input
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-base text-[#2e1f2c] placeholder:text-[#7a5d6b] focus:outline-none"
            style={{ borderColor: "var(--border-soft)", backgroundColor: "white" }}
            placeholder={credentialMode === "email" ? "Enter Email Id" : "Enter Mobile Number"}
            value={identifierValue}
            onChange={(event) => (credentialMode === "email" ? setEmail(event.target.value) : setPhone(event.target.value))}
            type={credentialMode === "email" ? "email" : "tel"}
          />
        </label>
        <label className="block text-sm font-semibold" style={{ color: "var(--color-plum)" }}>
          Password
          <div
            className="mt-2 flex items-center rounded-2xl border px-4"
            style={{ borderColor: "var(--border-soft)", backgroundColor: "white" }}
          >
            <input
              className="w-full bg-transparent py-3 text-base text-[#2e1f2c] placeholder:text-[#7a5d6b] focus:outline-none"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-sm font-semibold"
              style={{ color: "var(--color-plum)" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm font-semibold" style={{ color: "#ff9aa2" }}>{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-plum)",
            color: "white",
            boxShadow: "0 12px 30px rgba(90, 48, 66, 0.25)",
          }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Login"}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-[#5a3042]"
        >
          Forgotten password?
        </button>
      </form>
    </div>
  );
};
