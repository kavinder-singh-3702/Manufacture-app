import type { Metadata } from "next";
import { HeroEntry, DescriptionSection, SnapshotShowcase, TopBar, FooterCTA, MarketplaceSection } from "@/src/features/marketing";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { getMarketplaceSnapshot } from "@/src/features/marketing/server/publicData";
import { SponsoredRail } from "@/src/features/ads/components/SponsoredRail";

// The homepage previously inherited the root layout's generic
// "Web console for the ARVANN marketplace workspace" title/description
// (itself just a placeholder) — the single most-linked, most-crawled page on
// the site had no metadata of its own targeting the marketplace's actual
// primary search intent.
export const metadata: Metadata = {
  title: "ARVANN — B2B Marketplace for Indian Manufacturers & Suppliers",
  description:
    "Source products from verified Indian manufacturers, suppliers, traders, wholesalers, importers and exporters across 20+ industries. Post RFQs, compare quotes, and buy direct on ARVANN.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const snapshot = await getMarketplaceSnapshot();

  return (
    <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
      <TopBar />
      <main className="flex-1">
        {/* Hero carries its own sponsored banner, above the fold */}
        <HeroEntry snapshot={snapshot} />
        <div className="mx-auto w-full max-w-[1600px] space-y-16 px-6 py-12 lg:px-10">
          {/* Sponsored rail — 3-up cards, shown to every visitor, logged in or not */}
          <SponsoredRail />
          {/* Marketplace: categories + featured products + sell CTA */}
          <MarketplaceSection />
          <DescriptionSection />
          <SnapshotShowcase />
          <FooterCTA />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
