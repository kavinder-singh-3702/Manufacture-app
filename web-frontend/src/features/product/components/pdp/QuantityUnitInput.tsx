type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
};

/** Stepper + unit label — shared by the buy box, inquiry form and quote form so quantity input behaves identically everywhere. */
export const QuantityUnitInput = ({ value, onChange, min = 1, step = 1, unit, disabled }: Props) => {
  const clamp = (n: number) => Math.max(min, n);

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
      <button type="button" disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
        className="flex h-9 w-9 items-center justify-center text-base font-bold transition-opacity hover:opacity-70 disabled:opacity-30"
        style={{ color: "var(--foreground)" }} aria-label="Decrease quantity">
        −
      </button>
      <input type="number" inputMode="numeric" value={value} disabled={disabled} min={min} step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? clamp(n) : min);
        }}
        className="h-9 w-14 border-x text-center text-sm font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }} />
      <button type="button" disabled={disabled}
        onClick={() => onChange(clamp(value + step))}
        className="flex h-9 w-9 items-center justify-center text-base font-bold transition-opacity hover:opacity-70 disabled:opacity-30"
        style={{ color: "var(--foreground)" }} aria-label="Increase quantity">
        +
      </button>
      {unit && (
        <span className="border-l px-3 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--background)" }}>
          {unit}
        </span>
      )}
    </div>
  );
};
