import { ReactNode } from "react";
import Link from "next/link";

type Props = {
  companyId: string;
  displayName: string;
  logoUrl?: string;
  location?: string;
  /** "rail" — sticky vertical card (desktop). "band" — full-width horizontal card (mobile/tablet). */
  variant: "rail" | "band";
  children: ReactNode;
};

/** Seller identity block + trust content. Layout only — badges/rating/CTAs are composed in by the caller. */
export const SellerCard = ({ companyId, displayName, logoUrl, location, variant, children }: Props) => (
  <div className={variant === "rail" ? "space-y-4 rounded-3xl p-5" : "space-y-4 rounded-2xl p-5"}
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
    <Link href={`/sellers/${encodeURIComponent(companyId)}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: "var(--primary)" }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{displayName}</p>
        {location && <p className="truncate text-xs" style={{ color: "var(--medium-gray)" }}>{location}</p>}
      </div>
    </Link>
    {children}
  </div>
);
