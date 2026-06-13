"use client";

import { useSearchParams } from "next/navigation";
import { PublicMarketplace } from "./PublicMarketplace";

export const PublicMarketplacePageClient = () => {
  const searchParams = useSearchParams();

  return (
    <PublicMarketplace
      initialSearch={searchParams.get("q")?.trim() ?? ""}
      initialCategory={searchParams.get("category")?.trim() ?? ""}
    />
  );
};
