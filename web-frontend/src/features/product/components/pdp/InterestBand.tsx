type Props = {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/** Full-width mid-page CTA band — a second chance to convert after the buy box, matching IndiaMART's "Interested in this product?" strip. */
export const InterestBand = ({ title, subtitle, primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center sm:flex-row sm:justify-between sm:text-left"
    style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--accent) 8%, var(--primary-light)) 100%)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
    <div>
      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{title}</p>
      {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
    </div>
    <div className="flex flex-shrink-0 gap-2">
      {secondaryLabel && onSecondary && (
        <button type="button" onClick={onSecondary}
          className="rounded-xl px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
          style={{ border: "1.5px solid var(--accent)", color: "var(--accent-dark)", backgroundColor: "var(--accent-light)" }}>
          {secondaryLabel}
        </button>
      )}
      <button type="button" onClick={onPrimary}
        className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
        {primaryLabel}
      </button>
    </div>
  </div>
);
