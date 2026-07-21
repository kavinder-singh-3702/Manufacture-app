"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ThemeProvider } from "../src/providers/ThemeProvider";
import { ToastProvider } from "../src/components/ui/Toast";
import { ConfirmProvider } from "../src/components/ui/ConfirmDialog";
import { AdPopupHost } from "../src/features/ads/components/AdPopupHost";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider position="top-right">
          <ConfirmProvider>
            {children}
            {/* Global sponsored interstitial — gates itself off admin/auth routes. */}
            <AdPopupHost />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
