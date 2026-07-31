import { Metadata } from "next";
import Link from "next/link";
import { SignupCard } from "@/src/features/auth";

export const metadata: Metadata = {
  title: "ARVANN — Sign up",
  description: "Create a new ARVANN workspace for your manufacturing business.",
};

export default function SignUpPage() {
  return (
    <>
      <SignupCard />
      <p className="mt-6 text-center text-sm" style={{ color: "var(--medium-gray)" }}>
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
          Sign in →
        </Link>
      </p>
    </>
  );
}
