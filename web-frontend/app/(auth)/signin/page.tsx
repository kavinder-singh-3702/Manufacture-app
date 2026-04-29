import Link from "next/link";
import { LoginCard } from "@/src/features/auth";
import { LegalLinks } from "@/src/features/legal";
import { SignInHero } from "@/src/features/auth/components/SignInHero";
import { SignInFormPanel } from "@/src/features/auth/components/SignInFormPanel";

export const metadata = {
  title: "Manufacture — Sign in",
  description: "Log into your Manufacture Command workspace",
};

export default function SignInPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <SignInHero />
      <SignInFormPanel>
        <LoginCard />
        <p className="mt-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            Create one →
          </Link>
        </p>
        <div className="mt-4">
          <LegalLinks compact centered />
        </div>
      </SignInFormPanel>
    </div>
  );
}
