import { formatCurrency } from "../../utils/categories";

type Props = {
  amount: number;
  currency: string;
  unit?: string;
  primaryLabel: string;
  onPrimary: () => void;
};

/** Mobile/tablet bottom bar — price stays visible and the primary CTA is always one tap away below 1024px. */
export const StickyActionBar = ({ amount, currency, unit, primaryLabel, onPrimary }: Props) => (
  <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 px-4 py-3 lg:hidden"
    style={{
      backgroundColor: "color-mix(in srgb, var(--surface) 96%, transparent)",
      borderTop: "1px solid var(--border)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      paddingBottom: "calc(0.75rem + var(--safe-bottom))",
    }}>
    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-black" style={{ color: "var(--foreground)" }}>
        {formatCurrency(amount, currency)}
        {unit && <span className="text-xs font-normal" style={{ color: "var(--medium-gray)" }}> /{unit}</span>}
      </p>
      <p className="text-[10px]" style={{ color: "var(--medium-gray)" }}>Exclusive of taxes</p>
    </div>
    <button type="button" onClick={onPrimary}
      className="flex-shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
      {primaryLabel}
    </button>
  </div>
);
