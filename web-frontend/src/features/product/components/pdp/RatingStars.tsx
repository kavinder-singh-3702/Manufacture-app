type Props = {
  /** 0–5. Component renders nothing when omitted — callers must never pass a fabricated value. */
  value?: number | null;
  count?: number | null;
  size?: "sm" | "md";
};

const Star = ({ fill, size }: { fill: number; size: number }) => (
  <span className="relative inline-block leading-none" style={{ width: size, height: size }} aria-hidden="true">
    <span className="absolute inset-0" style={{ color: "var(--border)" }}>★</span>
    <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%`, color: "#F59E0B" }}>★</span>
  </span>
);

/** Star rating + optional review count. Renders nothing without real data — no placeholder stars. */
export const RatingStars = ({ value, count, size = "md" }: Props) => {
  if (value === null || value === undefined) return null;
  const clamped = Math.max(0, Math.min(5, value));
  const px = size === "sm" ? 12 : 15;

  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`Rated ${clamped.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ""}`}>
      <div className="flex" style={{ fontSize: px, gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={px} fill={Math.max(0, Math.min(1, clamped - i))} />
        ))}
      </div>
      <span className={size === "sm" ? "text-[11px] font-bold" : "text-xs font-bold"} style={{ color: "var(--foreground)" }}>
        {clamped.toFixed(1)}
      </span>
      {typeof count === "number" && count > 0 && (
        <span className={size === "sm" ? "text-[10px]" : "text-[11px]"} style={{ color: "var(--medium-gray)" }}>
          ({count.toLocaleString("en-IN")})
        </span>
      )}
    </div>
  );
};
