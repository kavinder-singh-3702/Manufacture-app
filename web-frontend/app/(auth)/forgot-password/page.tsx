import Link from "next/link";
import { CommandHero, QuickActions } from "@/src/features/dashboard";
import { ForgotPasswordCard } from "@/src/features/auth";

export const metadata = {
  title: "Manufacture Command — Forgot password",
  description: "Request a password reset token for your Manufacture Command workspace.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen pb-16 pt-10" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <CommandHero
            headline="Keep operations moving."
            description="Request a reset token with your registered email or mobile number. We keep responses vague by design to protect accounts."
            pillars={["Session security", "Multi-channel alerts", "Human support"]}
          />

          <div
            className="rounded-3xl border p-6 shadow-lg shadow-[#5a30422a]"
            style={{
              borderColor: "var(--border-soft)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
              How resets work
            </p>
            <div className="mt-3 space-y-2 text-sm text-[#5c4451]">
              <p>1) Tell us your email or phone. 2) We generate a short-lived token. 3) Paste it into the reset form.</p>
              <p className="font-semibold text-[#2e1f2c]">
                In non-production we will show the token here so you can test without email delivery.
              </p>
            </div>
            <Link
              href="/reset-password"
              className="mt-4 inline-flex items-center text-sm font-semibold"
              style={{ color: "var(--color-plum)" }}
            >
              Already have a token? Go to reset →
            </Link>
          </div>

          <QuickActions />
        </div>

        <aside className="w-full max-w-xl">
          <ForgotPasswordCard />
          <p className="mt-6 text-center text-sm text-[#5c4451]">
            Remember your credentials?{" "}
            <Link href="/signin" className="font-semibold" style={{ color: "var(--color-plum)" }}>
              Back to sign in
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
