import Link from "next/link";
import { LoginCard } from "@/src/features/auth";

export const metadata = {
  title: "ARVANN — Sign in",
  description: "Log into your ARVANN workspace",
};

export default function SignInPage() {
  return (
    <>
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
    </>
  );
}
