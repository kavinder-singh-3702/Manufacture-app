"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../src/providers/AuthProvider";

export const Providers = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
