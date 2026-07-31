"use client";

import { ReactNode } from "react";
import { LegalLinks } from "@/src/features/legal";
import { useAuth } from "@/src/hooks/useAuth";
import { AUTH_STEP_COPY } from "../flow/authFlow";
import { useAuthFlow } from "../flow/useAuthFlow";
import { SignInHero } from "./SignInHero";
import { SignInFormPanel } from "./SignInFormPanel";

// Web analog of AuthScreen.tsx: a shell that stays mounted across every
// step of the auth flow (rendered once by app/(auth)/layout.tsx) while the
// step underneath swaps. Owns the parts that are shared across every step —
// the hero panel, the panel wrapper, the bootstrap-error banner (parity
// with AuthScreen's error banner, previously unrendered on web), and the
// legal links footer — so individual step pages only render their card.
export const AuthFlowShell = ({ children }: { children: ReactNode }) => {
  const { step } = useAuthFlow();
  const { bootstrapError } = useAuth();
  const copy = AUTH_STEP_COPY[step];

  return (
    <div className="flex min-h-screen">
      <SignInHero headline={copy.headline} description={copy.description} footer={copy.footer} />

      <SignInFormPanel>
        {children}

        {bootstrapError ? (
          <div
            className="mt-6 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
          >
            <p className="font-semibold">Environment issue</p>
            <p className="mt-1">{bootstrapError}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <LegalLinks compact centered />
        </div>
      </SignInFormPanel>
    </div>
  );
};
