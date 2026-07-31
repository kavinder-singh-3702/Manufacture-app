"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_BACK, AUTH_ROUTES, AuthStep, stepFromPathname } from "./authFlow";

// Client-side analog of AuthScreen's `view` state + setView (see
// app-frontend/src/screens/auth/AuthScreen.tsx), backed by real routes
// instead of local state.
export const useAuthFlow = () => {
  const router = useRouter();
  const pathname = usePathname();
  const step = useMemo(() => stepFromPathname(pathname), [pathname]);

  const go = useCallback(
    (nextStep: AuthStep) => {
      router.push(AUTH_ROUTES[nextStep]);
    },
    [router]
  );

  // Mirrors each screen's onBack prop in AuthScreen.tsx.
  const back = useCallback(() => {
    const previous = AUTH_BACK[step] ?? "intro";
    router.push(AUTH_ROUTES[previous]);
  }, [router, step]);

  // Skip-as-guest from the intro screen (AuthScreen's handleGuestAccess).
  // The app fabricates a role:"guest" pseudo-user; the web instead derives
  // guest state from `!user` everywhere, so this just routes to the one
  // dashboard surface that already renders for signed-out visitors
  // (GUEST_ALLOWED_PREFIXES in UserDashboard.tsx) rather than inventing a
  // parallel auth state that every gated surface would need to recognize.
  const browseAsGuest = useCallback(() => {
    router.push("/dashboard/products");
  }, [router]);

  return { step, go, back, browseAsGuest };
};
