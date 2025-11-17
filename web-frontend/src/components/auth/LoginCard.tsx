"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/api-error";

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
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Login</p>
          <h3 className="text-xl font-semibold text-slate-900">Welcome back</h3>
          <p className="text-sm text-slate-500">Use your registered email or phone number.</p>
        </div>
        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Ops</div>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
          {(["email", "phone"] as CredentialMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCredentialMode(mode)}
              className={`flex-1 rounded-full px-3 py-2 transition ${
                credentialMode === mode ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              {mode === "email" ? "Email" : "Mobile"}
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold text-slate-800">
          {credentialMode === "email" ? "Email address" : "Mobile number"}
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            placeholder={credentialMode === "email" ? "Enter Email Id" : "Enter Mobile Number"}
            value={identifierValue}
            onChange={(event) => (credentialMode === "email" ? setEmail(event.target.value) : setPhone(event.target.value))}
            type={credentialMode === "email" ? "email" : "tel"}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          Password
          <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4">
            <input
              className="w-full bg-transparent py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-sm font-semibold text-slate-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Login"}
        </button>
        <button type="button" className="w-full text-center text-sm font-semibold text-slate-500">
          Forgotten password?
        </button>
      </form>
    </div>
  );
};
