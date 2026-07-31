import { ReactNode } from "react";
import { AuthFlowShell } from "@/src/features/auth/components/AuthFlowShell";

// Persists across every step of the auth flow (welcome/signin/signup/
// forgot-password/reset-password) — the shell mounts once and only the
// step content underneath (see template.tsx) swaps and animates. This is
// the routed equivalent of AuthScreen.tsx staying mounted while the app
// swaps its internal `view` state.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthFlowShell>{children}</AuthFlowShell>;
}
