"use client";

import { useSearchParams } from "next/navigation";
import { PublicMarketplace } from "./PublicMarketplace";

/**
 * Reads the `?category=` deep-link for the marketplace page. The search query
 * is no longer threaded through here — PublicMarketplace binds directly to
 * `?q=` via useUrlSearchQuery so it stays in sync with the URL instead of
 * snapshotting it once at mount.
 */
export const PublicMarketplacePageClient = () => {
  const searchParams = useSearchParams();

  return <PublicMarketplace initialCategory={searchParams.get("category")?.trim() ?? ""} />;
};
