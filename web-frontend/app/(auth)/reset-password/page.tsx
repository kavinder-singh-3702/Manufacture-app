import { Suspense } from "react";
import Link from "next/link";
import { CommandHero, SpotlightPrograms } from "@/src/features/dashboard";
import { ResetPasswordCard } from "@/src/features/auth";
import { LegalLinks } from "@/src/features/legal";

export const metadata = {
  title: "Manufacture Command — Reset password",
  description: "Use your reset token to choose a new Manufacture Command password.",
};

const ResetPasswordCardFallback = () => (
  <div
    className="rounded-3xl p-6 shadow-xl shadow-[#5a304230]/20"
    style={{
      border: "1px solid var(--border-soft)",
      background: "linear-gradient(135deg, #fffdf9, var(--color-linen))",
      color: "var(--foreground)",
    }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
      New password
    </p>
    <h3 className="mt-2 text-xl font-semibold text-[#2e1f2c]">Loading reset form…</h3>
    <p className="mt-3 text-sm text-[#5c4451]">Preparing your secure reset experience.</p>
  </div>
);

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen pb-16 pt-10" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:flex-row-reverse">
        <aside className="w-full max-w-xl">
          <Suspense fallback={<ResetPasswordCardFallback />}>
            <ResetPasswordCard />
          </Suspense>
          <p className="mt-6 text-center text-sm text-[#5c4451]">
            Don&apos;t have a token yet?{" "}
            <Link href="/forgot-password" className="font-semibold" style={{ color: "var(--color-plum)" }}>
              Request reset instructions
            </Link>
          </p>
          <div className="mt-4">
            <LegalLinks compact centered className="text-[#7a5d6b]" />
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <CommandHero
            headline="Prove possession, then reset."
            description="Paste your token to automatically sign back in with a new password. Tokens expire quickly to keep your workspace safe."
            pillars={["Expiry enforced", "Session continuity", "No email leaks"]}
          />

          <SpotlightPrograms />
        </div>
      </div>
    </main>
  );
}
