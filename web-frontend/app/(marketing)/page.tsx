import { HeroEntry, DescriptionSection, SnapshotShowcase, FooterCTA, TopBar } from "@/src/features/marketing";

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="min-h-screen pb-20 pt-10" style={{ color: "var(--foreground)" }}>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 lg:px-10">
          <HeroEntry />
          <DescriptionSection />
          <SnapshotShowcase />
          <FooterCTA />
        </div>
      </main>
    </>
  );
}
