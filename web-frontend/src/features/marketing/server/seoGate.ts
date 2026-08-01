/**
 * Shared thin-content threshold for the industry/subcategory taxonomy pages
 * (and their sitemap entries). With only a handful of live marketplace
 * listings today, most of the ~107 industry/subcategory pages would have
 * zero or one product — exactly the doorway-page pattern that can trigger a
 * sitewide quality penalty if Google indexes them anyway. A page below this
 * threshold still renders normally (a real visitor following a link sees a
 * genuine page, not an error) but sets `robots: { index: false, follow: true }`
 * and is left out of sitemap.ts — it flips to indexable automatically on the
 * next ISR revalidation once real listings arrive, no code change needed.
 */
export const MIN_LISTINGS_TO_INDEX = 3;

export const isThinListing = (count: number): boolean => count < MIN_LISTINGS_TO_INDEX;
