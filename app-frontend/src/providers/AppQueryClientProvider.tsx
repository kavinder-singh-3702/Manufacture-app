import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "../lib/queryClient";

/**
 * Thin wrapper around React Query's provider so the app's root only has to import one symbol.
 * Kept separate from src/lib/queryClient.ts to avoid coupling the client instance to React rendering.
 */
export const AppQueryClientProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
