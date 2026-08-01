import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthFlowShell } from "@/src/features/auth/components/AuthFlowShell";

// robots.txt disallows these paths (stops crawling) but doesn't stop an
// already-linked URL from being indexed — this meta tag is what actually
// keeps /signin, /signup, /welcome, etc. out of search results. Individual
// pages under (auth) don't set their own `robots`, so this value passes
// through Next's metadata merge unchanged.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Persists across every step of the auth flow (welcome/signin/signup/
// forgot-password/reset-password) — the shell mounts once and only the
// step content underneath (see template.tsx) swaps and animates. This is
// the routed equivalent of AuthScreen.tsx staying mounted while the app
// swaps its internal `view` state.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthFlowShell>{children}</AuthFlowShell>;
}
