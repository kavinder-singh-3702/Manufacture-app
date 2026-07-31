import { HeroEntry, DescriptionSection, SnapshotShowcase, TopBar, FooterCTA, MarketplaceSection } from "@/src/features/marketing";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { getMarketplaceSnapshot } from "@/src/features/marketing/server/publicData";
import { SponsoredRail } from "@/src/features/ads/components/SponsoredRail";

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
