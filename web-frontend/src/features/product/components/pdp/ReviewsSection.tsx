import { RatingStars } from "./RatingStars";

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
  verifiedPurchase?: boolean;
};

export type ReviewAggregate = {
  average: number;
  count: number;
  /** Count of reviews per star value, 1–5. Optional — histogram omitted if absent. */
  histogram?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
};

type Props = {
  aggregate?: ReviewAggregate | null;
  reviews?: ProductReview[];
};

/**
 * Summary + histogram + review list. There is no product-review model yet
 * ([backend/src/models/feedback.model.js] is app feedback, not this) — this
 * component renders nothing until real data exists. No placeholder stars,
 * no seeded counts, ever.
 */
export const ReviewsSection = ({ aggregate, reviews = [] }: Props) => {
  if (!aggregate || aggregate.count === 0) return null;

  const maxBucket = Math.max(1, ...Object.values(aggregate.histogram ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex-shrink-0 text-center">
          <p className="text-4xl font-black" style={{ color: "var(--foreground)" }}>{aggregate.average.toFixed(1)}</p>
          <RatingStars value={aggregate.average} />
          <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>{aggregate.count.toLocaleString("en-IN")} reviews</p>
        </div>

        {aggregate.histogram && (
          <div className="flex-1 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const n = aggregate.histogram?.[star] ?? 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 flex-shrink-0 font-semibold" style={{ color: "var(--medium-gray)" }}>{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(n / maxBucket) * 100}%`, backgroundColor: "#F59E0B" }} />
                  </div>
                  <span className="w-6 flex-shrink-0 text-right" style={{ color: "var(--medium-gray)" }}>{n}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl p-4" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{r.author}</p>
                <RatingStars value={r.rating} size="sm" />
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: "var(--medium-gray)" }}>
                <span>{new Date(r.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                {r.verifiedPurchase && <span style={{ color: "var(--success)" }}>✓ Verified purchase</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
