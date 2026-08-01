/**
 * Canonical site origin, no trailing slash. Single source of truth for every
 * canonical tag, sitemap URL, robots `Host:`, and JSON-LD `url` field — this
 * used to be copy-pasted as
 * `(process.env.NEXT_PUBLIC_SITE_URL ?? "https://arvann.in").replace(/\/+$/, "")`
 * across half a dozen files (root layout, sitemap.ts, robots.ts, the product
 * and seller detail pages), which is exactly how a canonical-host mismatch
 * can drift silently: change the fallback in one copy and the rest disagree.
 *
 * Set `NEXT_PUBLIC_SITE_URL` explicitly in Vercel's project env — the
 * fallback below must always match whichever host is the Primary domain in
 * Vercel's domain settings (the apex, `https://arvann.in`, as of this
 * writing), since Vercel 308-redirects the other one and a canonical tag
 * pointing at a URL that redirects is effectively broken.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://arvann.in").replace(/\/+$/, "");
