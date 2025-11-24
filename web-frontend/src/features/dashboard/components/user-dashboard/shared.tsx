import type { ReactNode } from "react";

export const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
        {subtitle ?? "Workspace"}
      </p>
      <h2 className="text-2xl font-semibold text-[#2e1f2c]">{title}</h2>
    </div>
    {action}
  </div>
);

type ProfileInputFieldProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
};

export const ProfileInputField = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  disabled = false,
  multiline = false,
  rows = 1,
}: ProfileInputFieldProps) => {
  const baseClasses = "mt-2 w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none";
  const enabledClasses = "border-[var(--border-soft)] bg-white text-[#2e1f2c]";
  const disabledClasses = "border-dashed border-[var(--border-soft)] bg-white/70 text-[#7a5d6b]";
  const className = `${baseClasses} ${disabled ? disabledClasses : enabledClasses}`;

  return (
    <label className="text-sm font-semibold text-[#2e1f2c]">
      {label}
      {multiline ? (
        <textarea
          className={className}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          className={className}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
      {helperText ? <span className="mt-1 block text-xs text-[#b98b9e]">{helperText}</span> : null}
    </label>
  );
};
