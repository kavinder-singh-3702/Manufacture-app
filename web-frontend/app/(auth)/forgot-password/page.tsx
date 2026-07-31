import Link from "next/link";
import { ForgotPasswordCard } from "@/src/features/auth";

export const metadata = {
  title: "ARVANN — Forgot password",
  description: "Request a password reset code and link for your ARVANN workspace.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordCard />
      <p className="mt-6 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
        Remember your credentials?{" "}
        <Link href="/signin" className="font-semibold" style={{ color: "var(--primary)" }}>
          Back to sign in
        </Link>
      </p>
    </>
  );
}
