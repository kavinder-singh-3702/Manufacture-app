import { HeroEntry, DescriptionSection, SnapshotShowcase, TopBar, FooterCTA } from "@/src/features/marketing";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
      <TopBar />
      <main className="flex-1">
        <HeroEntry />
        <div className="mx-auto w-full max-w-[1600px] space-y-10 px-6 py-12 lg:px-10">
          <DescriptionSection />
          <SnapshotShowcase />
          <FooterCTA />
        </div>
      </main>
    </div>
  );
}
