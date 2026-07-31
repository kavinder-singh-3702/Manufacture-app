import type { TrustBadge } from "../../utils/seller";

type Props = { badges: TrustBadge[] };

/** Verified / GST / member-since pills. Renders nothing when there are no real badges. */
export const TrustBadgeRow = ({ badges }: Props) => {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span key={badge.label}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: "color-mix(in srgb, var(--success) 13%, transparent)",
            border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
            color: "var(--success)",
          }}>
          <span aria-hidden="true">{badge.icon}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
};
