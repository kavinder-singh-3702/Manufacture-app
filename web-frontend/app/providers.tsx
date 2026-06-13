"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ThemeProvider } from "../src/providers/ThemeProvider";
import { ToastProvider } from "../src/components/ui/Toast";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider position="top-right">
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
