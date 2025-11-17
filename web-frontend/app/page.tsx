import { CommandHero } from "@/src/components/dashboard/CommandHero";
import { QuickActions } from "@/src/components/dashboard/QuickActions";
import { CategoryHighlights } from "@/src/components/dashboard/CategoryHighlights";
import { MarketplacePulse } from "@/src/components/dashboard/MarketplacePulse";
import { SpotlightPrograms } from "@/src/components/dashboard/SpotlightPrograms";
import { InventoryWidget } from "@/src/components/dashboard/InventoryWidget";
import { AuthSummaryCard } from "@/src/components/auth/AuthSummaryCard";
import { LoginCard } from "@/src/components/auth/LoginCard";
import { SignupCard } from "@/src/components/auth/SignupCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 lg:flex-row lg:gap-10">
        <div className="flex flex-1 flex-col gap-6">
          <CommandHero
            headline="Connect with verified sellers, manage sourcing, and boost exports."
            description="A single trusted workspace to orchestrate procurement, supplier intelligence, and field teams."
          />
          <QuickActions />
          <CategoryHighlights />
          <MarketplacePulse />
          <SpotlightPrograms />
          <InventoryWidget />
        </div>
        <aside className="flex w-full max-w-xl flex-col gap-6 lg:w-[360px]">
          <AuthSummaryCard />
          <LoginCard />
          <SignupCard />
        </aside>
      </div>
    </main>
  );
}
