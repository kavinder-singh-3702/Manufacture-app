"use client";

import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

type UseLogoutOptions = {
  /** Runs after confirmation, before the network call — e.g. clearCart(). */
  onBeforeLogout?: () => void;
};

/**
 * Single source of truth for "sign out": confirmation, the network call, and
 * loading state. AuthProvider.logout() always clears local state — and does
 * a hard `window.location.replace("/signin")`, not a router navigation, so
 * every provider's in-memory state is torn down rather than carried into the
 * next sign-in — even if the network call fails, so the catch here only
 * surfaces a toast; it never skips the redirect.
 */
export const useLogout = ({ onBeforeLogout }: UseLogoutOptions = {}) => {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
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
    }
  }, [confirm, logout, onBeforeLogout, toast]);

  return { signOut, loggingOut };
};
