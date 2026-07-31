import { formatCurrency } from "../../utils/categories";

type Props = {
  amount: number;
  currency: string;
  unit?: string;
  /** Variant label, e.g. "Red / Large", shown next to the "Price" eyebrow. */
  variantLabel?: string;
  /** "Variants from ₹X" hint when a base product has multiple priced variants and none is selected yet. */
  fromHint?: string;
  moq?: string | null;
};

/** ₹ amount + unit + tax note + MOQ. The lead-hook price block reused by the buy box and the mobile sticky bar. */
export const PriceBlock = ({ amount, currency, unit, variantLabel, fromHint, moq }: Props) => (
  <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 5%, transparent) 100%)" }}>
    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
      Price {variantLabel && <span className="normal-case font-normal">· {variantLabel}</span>}
    </p>
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-black" style={{ color: "var(--foreground)" }}>
        {formatCurrency(amount, currency)}
      </span>
      {unit && <span className="text-sm" style={{ color: "var(--medium-gray)" }}>/ {unit}</span>}
    </div>
    <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Exclusive of all taxes</p>
    {fromHint && <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>{fromHint}</p>}
    {moq && (
      <p className="mt-2 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
        Minimum Order Quantity: <span style={{ color: "var(--primary)" }}>{moq}</span>
      </p>
    )}
  </div>
);
