import Link from "next/link";
import { SignupCard } from "@/src/features/auth";
import { SpotlightPrograms, QuickActions } from "@/src/features/dashboard";

export const metadata = {
  title: "Manufacture Command — Sign up",
  description: "Create a new Manufacture Command workspace profile",
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen pb-16 pt-10" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:flex-row-reverse">
        <aside className="w-full max-w-xl">
          <SignupCard />
          <p className="mt-6 text-center text-sm text-white/70">
            Already joined?{" "}
            <Link href="/signin" className="font-semibold" style={{ color: "var(--color-peach)" }}>
              Sign in to your workspace
            </Link>
          </p>
        </aside>
        <div className="flex flex-1 flex-col gap-6">
          <QuickActions />
          <SpotlightPrograms />
        </div>
      </div>
    </main>
  );
}
