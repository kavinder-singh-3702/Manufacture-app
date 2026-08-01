/**
 * Suspense fallback for the marketplace routes. `PublicMarketplace` reads
 * `?q=` via useSearchParams, and a client component doing that must sit under
 * a Suspense boundary — otherwise Next opts the entire route out of
 * prerendering and the first paint is an empty document.
 */
export const MarketplaceSkeleton = () => (
  <div>
    <div className="border-b px-6 py-8 lg:px-10" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1400px] space-y-2">
        <div className="h-3 w-24 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
        <div className="h-7 w-56 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      </div>
    </div>
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
      <div className="mb-5 h-11 w-full animate-pulse rounded-xl" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />
        ))}
      </div>
    </div>
  </div>
);
