"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";

type CredentialMode = "email" | "phone";

export const LoginCard = () => {
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
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl p-6 shadow-xl shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.2)",
        background: "linear-gradient(135deg, rgba(26, 36, 64, 0.95), rgba(46, 46, 58, 0.8))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Login
          </p>
          <h3 className="text-xl font-semibold text-white">Welcome back</h3>
          <p className="text-sm text-white/70">Use your registered email or phone number.</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: "var(--color-plum)" }}
        >
          Ops
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div
          className="flex gap-2 rounded-full p-1 text-sm font-semibold"
          style={{ backgroundColor: "rgba(46, 46, 58, 0.8)" }}
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
                  color: isActive ? "var(--color-plum)" : "rgba(255,255,255,0.7)",
                  boxShadow: isActive ? "0 5px 25px rgba(250, 218, 208, 0.5)" : undefined,
                }}
              >
                {mode === "email" ? "Email" : "Mobile"}
              </button>
            );
          })}
        </div>
        <label className="block text-sm font-semibold text-white">
          {credentialMode === "email" ? "Email address" : "Mobile number"}
          <input
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-base text-white placeholder:text-white/60 focus:outline-none"
            style={{ borderColor: "rgba(250, 218, 208, 0.35)", backgroundColor: "rgba(17, 24, 39, 0.4)" }}
            placeholder={credentialMode === "email" ? "Enter Email Id" : "Enter Mobile Number"}
            value={identifierValue}
            onChange={(event) => (credentialMode === "email" ? setEmail(event.target.value) : setPhone(event.target.value))}
            type={credentialMode === "email" ? "email" : "tel"}
          />
        </label>
        <label className="block text-sm font-semibold text-white">
          Password
          <div
            className="mt-2 flex items-center rounded-2xl border px-4"
            style={{ borderColor: "rgba(250, 218, 208, 0.35)", backgroundColor: "rgba(17, 24, 39, 0.4)" }}
          >
            <input
              className="w-full bg-transparent py-3 text-base text-white placeholder:text-white/60 focus:outline-none"
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
              style={{ color: "var(--color-peach)" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm font-semibold" style={{ color: "#ff9aa2" }}>{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Login"}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm font-semibold"
          style={{ color: "var(--color-peach)" }}
        >
          Forgotten password?
        </button>
      </form>
    </div>
  );
};
