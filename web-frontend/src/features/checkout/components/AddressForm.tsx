"use client";

import { motion } from "framer-motion";
import type { CheckoutAddressInput } from "@/src/types/cart";

type AddressFormProps = {
  value: CheckoutAddressInput;
  onChange: (updated: CheckoutAddressInput) => void;
  errors?: Partial<Record<keyof CheckoutAddressInput, string>>;
  disabled?: boolean;
};

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  border: `1px solid ${hasError ? "var(--accent)" : "var(--border)"}`,
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
});

const Field = ({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </span>
    {children}
    {error && (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
        {error}
      </motion.p>
    )}
  </label>
);

const cls = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(20,141,178,0.2)]";

export const AddressForm = ({ value, onChange, errors = {}, disabled }: AddressFormProps) => {
  const set = <K extends keyof CheckoutAddressInput>(k: K, v: string) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
        Shipping address
      </p>

      <Field label="Address line 1" required error={errors.line1}>
        <input
          className={cls} style={inputStyle(!!errors.line1)}
          placeholder="House / flat no., street, area"
          value={value.line1} onChange={(e) => set("line1", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <Field label="Address line 2">
        <input
          className={cls} style={inputStyle()}
          placeholder="Landmark, building name (optional)"
          value={value.line2 ?? ""} onChange={(e) => set("line2", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" required error={errors.city}>
          <input
            className={cls} style={inputStyle(!!errors.city)}
            placeholder="Mumbai"
            value={value.city} onChange={(e) => set("city", e.target.value)}
            disabled={disabled}
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <input
            className={cls} style={inputStyle(!!errors.state)}
            placeholder="Maharashtra"
            value={value.state} onChange={(e) => set("state", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Postal code" required error={errors.postalCode}>
          <input
            className={cls} style={inputStyle(!!errors.postalCode)}
            placeholder="400001"
            value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)}
            disabled={disabled}
          />
        </Field>
        <Field label="Country" required error={errors.country}>
          <input
            className={cls} style={inputStyle(!!errors.country)}
            placeholder="India"
            value={value.country} onChange={(e) => set("country", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>
    </div>
  );
};

export const emptyAddress = (): CheckoutAddressInput => ({
  line1: "", line2: "", city: "", state: "", postalCode: "", country: "India",
});

export const validateAddress = (addr: CheckoutAddressInput): Partial<Record<keyof CheckoutAddressInput, string>> => {
  const errs: Partial<Record<keyof CheckoutAddressInput, string>> = {};
  if (!addr.line1.trim()) errs.line1 = "Address is required";
  if (!addr.city.trim()) errs.city = "City is required";
  if (!addr.state.trim()) errs.state = "State is required";
  if (!addr.postalCode.trim()) errs.postalCode = "Postal code is required";
  if (!addr.country.trim()) errs.country = "Country is required";
  return errs;
};
