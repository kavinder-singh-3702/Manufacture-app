"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { authService } from "@/src/services/auth";
import { AnimatedInput } from "@/src/components/ui/Input";
import { AnimatedButton } from "@/src/components/ui/Button";
import { ApiError } from "@/src/lib/api-error";

const PHONE_PATTERN = /^[0-9+]{7,15}$/;

/**
 * PhoneGate — mirrors the app's mandatory AddMobileNumber gate.
 *
 * Any authenticated non-guest user without a phone is locked to this screen
 * until they submit one. The email signup wizard already captures phone, so
 * this primarily catches social sign-in and legacy accounts. The only exit
 * without entering a number is to sign out.
 *
 * Rendered by both DashboardFrame and AdminFrame, so it lives in the shared
 * auth feature rather than either shell.
 */
export const PhoneGate = () => {
  const { user, setUser, logout } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = phone.trim();
    if (!PHONE_PATTERN.test(trimmed)) {
      setError("Use 7-15 digits, optionally starting with +");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const updated = await authService.updatePhone(trimmed);
      // Once user.phone is populated the gate in the shell falls through and
      // the regular authenticated UI renders — no manual navigation needed.
      setUser(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save mobile number. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl p-7 sm:p-9"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px -28px rgba(15,110,140,0.35)",
        }}
      >
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--primary-light)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 4h3l1.5 4.5L7.5 10a11 11 0 0 0 6.5 6.5l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
              stroke="var(--primary)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
          Help us reach you
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
          Add a mobile number for order coordination, account recovery, and support. Our team may
          call this number to follow up on requests.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-2">
          <AnimatedInput
            label="Mobile number *"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            maxLength={16}
            placeholder="+91 98765 43210"
            error={error ?? undefined}
            helperText={error ? undefined : "7-15 digits, optionally starting with +"}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
          />

          <div className="pt-3">
            <AnimatedButton type="submit" variant="primary" fullWidth loading={submitting}>
              Save mobile number
            </AnimatedButton>
          </div>
        </form>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 w-full text-center text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: "var(--medium-gray)" }}
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
};
