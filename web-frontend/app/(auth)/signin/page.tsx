import Link from "next/link";
import { LoginCard } from "@/src/features/auth";
import { CommandHero } from "@/src/features/dashboard";

export const metadata = {
  title: "Manufacture Command — Sign in",
  description: "Log into your Manufacture Command workspace",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen pb-16 pt-10" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <CommandHero
            headline="Welcome back to your workspace."
            description="Pick up sourcing conversations, respond to RFQs, and sync ops updates with one secure login."
          />
          <div
            className="rounded-3xl p-6 text-white shadow-2xl"
            style={{
              border: "1px solid rgba(250, 218, 208, 0.16)",
              backgroundColor: "rgba(17, 24, 39, 0.65)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
              New here?
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Create a Manufacture ID</h2>
            <p className="mt-3 text-white/75">
              Build trust with verified buyers and suppliers by onboarding your workspace in three guided steps.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold"
              style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
            >
              Start signup →
            </Link>
          </div>
        </div>
        <aside className="w-full max-w-xl">
          <LoginCard />
          <p className="mt-6 text-center text-sm text-white/70">
            Need a new workspace?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "var(--color-peach)" }}>
              Create an account
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
