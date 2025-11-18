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
            className="rounded-3xl p-6 shadow-2xl"
            style={{
              border: "1px solid var(--border-soft)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
              New here?
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#2e1f2c]">Create a Manufacture ID</h2>
            <p className="mt-3 text-[#5c4451]">
              Build trust with verified buyers and suppliers by onboarding your workspace in three guided steps.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-plum)",
                color: "white",
                boxShadow: "0 10px 25px rgba(90, 48, 66, 0.2)",
              }}
            >
              Start signup →
            </Link>
          </div>
        </div>
        <aside className="w-full max-w-xl">
          <LoginCard />
          <p className="mt-6 text-center text-sm text-[#5c4451]">
            Need a new workspace?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "var(--color-plum)" }}>
              Create an account
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
