import Link from "next/link";
import { CommandHero, SpotlightPrograms } from "@/src/features/dashboard";
import { ResetPasswordCard } from "@/src/features/auth";

export const metadata = {
  title: "Manufacture Command — Reset password",
  description: "Use your reset token to choose a new Manufacture Command password.",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen pb-16 pt-10" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:flex-row-reverse">
        <aside className="w-full max-w-xl">
          <ResetPasswordCard />
          <p className="mt-6 text-center text-sm text-[#5c4451]">
            Don&apos;t have a token yet?{" "}
            <Link href="/forgot-password" className="font-semibold" style={{ color: "var(--color-plum)" }}>
              Request reset instructions
            </Link>
          </p>
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
