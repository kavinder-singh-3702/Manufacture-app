"use client";

/**
 * Renders one `FieldDef` (content/fieldSchema.ts) against the form's flat
 * value record. This is what makes the field schema declarative — adding a
 * field to fieldSchema.ts is enough; nothing here needs to change per type.
 */

import { Field, FieldInput, FieldTextarea, fieldInputClass, fieldInputStyle } from "@/src/components/ui/FormField";
import type { FieldDef } from "../content/fieldSchema";

export type FieldRendererProps = {
  field: FieldDef;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
  error?: string;
  /** Tints the active chip/select state to the selected service type's accent instead of a generic primary. */
  accent?: string;
};

export const FieldRenderer = ({ field, value, onChange, error, accent = "var(--primary)" }: FieldRendererProps) => {
  const strValue = typeof value === "string" ? value : "";

  if (field.kind === "toggle") {
    const active = Boolean(value);
    return (
      <button
        type="button"
        onClick={() => onChange(field.name, !active)}
        className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-colors"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
          {field.label}
        </span>
        <span
          className="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors"
          style={{ backgroundColor: active ? accent : "var(--border)" }}
        >
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            style={{ transform: active ? "translateX(18px)" : "translateX(2px)" }}
          />
        </span>
      </button>
    );
  }

  if (field.kind === "chips") {
    return (
      <Field label={field.label} required={field.required} hint={field.hint} error={error}>
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const active = strValue === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(field.name, opt.id)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: active ? accent : "var(--surface)",
                  color: active ? "#fff" : "var(--foreground)",
                  border: active ? "none" : "1px solid var(--border)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>
    );
  }

  if (field.kind === "select") {
    return (
      <Field label={field.label} required={field.required} hint={field.hint} error={error}>
        <select
          className={fieldInputClass}
          style={fieldInputStyle(error)}
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          {field.options?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (field.kind === "textarea") {
    return (
      <Field label={field.label} required={field.required} hint={field.hint} error={error}>
        <FieldTextarea
          rows={3}
          placeholder={field.placeholder}
          value={strValue}
          error={error}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      </Field>
    );
  }

  return (
    <Field label={field.label} required={field.required} hint={field.hint} error={error}>
      <FieldInput
        type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
        min={field.kind === "number" ? 0 : undefined}
        placeholder={field.placeholder}
        value={strValue}
        error={error}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    </Field>
  );
};
