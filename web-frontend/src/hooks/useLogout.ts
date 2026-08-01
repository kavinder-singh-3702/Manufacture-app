"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

type UseLogoutOptions = {
  redirectTo?: string;
  /** Runs after confirmation, before the network call — e.g. clearCart(). */
  onBeforeLogout?: () => void;
};

/**
 * Single source of truth for "sign out": confirmation, the network call,
 * loading state, and the redirect. AuthProvider.logout() always clears local
 * state even if the network call fails, so the catch here only surfaces a
 * toast — it never skips the redirect.
 */
export const useLogout = ({ redirectTo = "/signin", onBeforeLogout }: UseLogoutOptions = {}) => {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const signOut = useCallback(async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "You'll need to sign in again to access your account.",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (!ok) return;

    setLoggingOut(true);
    try {
      onBeforeLogout?.();
      await logout();
    } catch {
      toast.error("Signed out", "There was a connection issue, but your session was cleared.");
    } finally {
      setLoggingOut(false);
      router.push(redirectTo);
    }
  }, [confirm, logout, onBeforeLogout, redirectTo, router, toast]);

  return { signOut, loggingOut };
};
