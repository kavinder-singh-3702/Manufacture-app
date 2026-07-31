export type TrustBadge = { icon: string; label: string };

/**
 * Minimal shape these helpers actually read. Both `Product["company"]`
 * (`_id`) and the full `Company` type (`id`) satisfy this structurally, so
 * the same badge/location/masking logic serves the PDP seller rail and the
 * full seller storefront without an adapter.
 */
export type CompanyLike = {
  type?: string;
  sizeBucket?: string;
  foundedAt?: string;
  createdAt?: string;
  complianceStatus?: string;
  documents?: { gstNumber?: string };
  headquarters?: { city?: string; state?: string };
};

/**
 * Trust pills for the seller rail / company table. Every badge maps to a
 * real field — nothing is shown just to fill space. IndiaMART shows a
 * TrustSEAL / "N years" badge; ours is the honest equivalent from data we
 * actually have (verification status, GST, tenure).
 */
export const buildTrustBadges = (company: CompanyLike | undefined): TrustBadge[] => {
  if (!company) return [];
  const badges: TrustBadge[] = [];
  if (company.complianceStatus === "approved") badges.push({ icon: "✅", label: "Verified Seller" });
  if (company.documents?.gstNumber) badges.push({ icon: "🧾", label: "GST Registered" });
  const since = memberSince(company);
  if (since) badges.push({ icon: "📅", label: `Member since ${since}` });
  return badges;
};

/** "City, State" from headquarters — null when neither is set (never renders a lone comma). */
export const formatCompanyLocation = (company: CompanyLike | undefined): string | null => {
  const parts = [company?.headquarters?.city, company?.headquarters?.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
};

/** Year the company joined, from `createdAt`. Null when unavailable — callers omit the badge, never fabricate a year. */
export const memberSince = (company: CompanyLike | undefined): string | null => {
  if (!company?.createdAt) return null;
  const year = new Date(company.createdAt).getFullYear();
  return Number.isNaN(year) ? null : String(year);
};

/**
 * Masks all but the last 2 digits of a phone number for the "View Mobile
 * Number" reveal pattern, e.g. "+91 98765 43210" → "+91 •••• ••210".
 * Reveal itself stays auth-gated by the caller — this only controls display.
 */
export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(Math.max(digits.length, 4));
  const visible = digits.slice(-2);
  const prefix = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : "";
  return `${prefix}•••• •••${visible}`;
};
