import { Metadata } from "next";
import Link from "next/link";
import { SignupCard } from "@/src/features/auth";
import { SignupHero } from "@/src/features/auth/components/SignupHero";
import { LegalLinks } from "@/src/features/legal";
import { BrandWordmark } from "@/src/components/BrandLogo";

export const metadata: Metadata = {
  title: "ARVANN — Sign up",
  description: "Create a new ARVANN workspace for your manufacturing business.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <SignupHero />

      {/* Right: form panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 lg:px-10">
        <div className="w-full max-w-md">
          {/* Mobile logo — hidden on desktop where hero shows */}
          <div className="mb-8 flex items-center lg:hidden">
            <BrandWordmark height={30} priority />
          </div>

          <SignupCard />

          <p className="mt-6 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
              Sign in →
            </Link>
          </p>
          <div className="mt-4">
            <LegalLinks compact centered />
          </div>
        </div>
      </div>
    </div>
  );
}
