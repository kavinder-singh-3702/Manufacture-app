import { Metadata } from "next";
import Link from "next/link";
import { SignupCard } from "@/src/features/auth";
import { SignupHero } from "@/src/features/auth/components/SignupHero";
import { LegalLinks } from "@/src/features/legal";

export const metadata: Metadata = {
  title: "Manufacture Command — Sign up",
  description: "Create a new Manufacture Command workspace for your manufacturing business.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <SignupHero />

      {/* Right: form panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 lg:px-10">
        <div className="w-full max-w-md">
          {/* Mobile logo — hidden on desktop where hero shows */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "var(--gradient-brand-strong)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Manufacture</p>
              <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Command</p>
            </div>
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
