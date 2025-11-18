import { HeroEntry, DescriptionSection, FooterCTA, TopBar } from "@/src/features/marketing";

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="min-h-screen pb-20 pt-10" style={{ color: "var(--foreground)" }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <HeroEntry />
          <DescriptionSection />
          <FooterCTA />
        </div>
      </main>
    </>
  );
}
