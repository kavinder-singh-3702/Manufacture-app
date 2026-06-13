/** Aspect ratio of the full ARVANN logo / icon asset (square). */
const LOGO_RATIO = 1;

type BrandImageProps = {
  /** Rendered height in px; width is derived from the asset aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Match the mobile app lockup: canonical square logo plus the ARVANN title.
 * Use a plain image because production is a static export without a Next image
 * optimizer server.
 */
export function BrandWordmark({ height = 28, className = "", priority = false }: BrandImageProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/arvann-logo.png"
        alt=""
        width={height}
        height={height}
        fetchPriority={priority ? "high" : undefined}
        style={{ height, width: height }}
      />
      <span
        className="font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--foreground)", fontSize: Math.max(14, Math.round(height * 0.62)) }}
      >
        ARVANN
      </span>
    </span>
  );
}

/**
 * The full ARVANN logo (factory skyline + wordmark). Use for large brand
 * moments such as marketing heroes or splash surfaces.
 */
export function BrandLogo({ height = 96, className = "", priority = false }: BrandImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/arvann-logo.png"
      alt="ARVANN"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      fetchPriority={priority ? "high" : undefined}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
