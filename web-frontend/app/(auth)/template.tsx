"use client";

import { usePathname } from "next/navigation";
import { AnimatedPage } from "@/src/components/ui/PageTransition";

// Templates remount on every navigation (unlike layout.tsx, which persists),
// so this is what actually plays a transition each time the auth step
// changes — the web equivalent of AuthScreen's entryOpacity/entryTranslate
// fade-and-rise on `view` change (app-frontend/src/screens/auth/AuthScreen.tsx#L48-L65).
// The shell in layout.tsx wraps this and never remounts.
export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <AnimatedPage pageKey={pathname}>{children}</AnimatedPage>;
}
