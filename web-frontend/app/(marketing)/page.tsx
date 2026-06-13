import { HeroEntry, DescriptionSection, SnapshotShowcase, TopBar, FooterCTA, MarketplaceSection } from "@/src/features/marketing";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
      <TopBar />
      <main className="flex-1">
        <HeroEntry />
        <div className="mx-auto w-full max-w-[1600px] space-y-16 px-6 py-12 lg:px-10">
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
