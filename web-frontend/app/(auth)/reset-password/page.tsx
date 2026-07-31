import { Suspense } from "react";
import Link from "next/link";
import { ResetPasswordCard } from "@/src/features/auth";

export const metadata = {
  title: "ARVANN — Reset password",
  description: "Use your reset code or link to choose a new ARVANN password.",
  robots: { index: false },
};

const ResetPasswordCardFallback = () => (
  <div
    className="rounded-3xl p-6 shadow-xl"
    style={{
      border: "1px solid var(--border)",
      backgroundColor: "var(--card)",
      color: "var(--foreground)",
      boxShadow: "var(--shadow-lg)",
    }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
      New password
    </p>
    <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--foreground)" }}>
      Loading reset form…
    </h3>
    <p className="mt-3 text-sm" style={{ color: "var(--medium-gray)" }}>
      Preparing your secure reset experience.
    </p>
  </div>
);

export default function ResetPasswordPage() {
  return (
    <>
      <Suspense fallback={<ResetPasswordCardFallback />}>
        <ResetPasswordCard />
      </Suspense>
      <p className="mt-6 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
        Don&apos;t have a code yet?{" "}
        <Link href="/forgot-password" className="font-semibold" style={{ color: "var(--primary)" }}>
          Request reset instructions
        </Link>
      </p>
    </>
  );
}
