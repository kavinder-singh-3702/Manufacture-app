import type { Metadata } from "next";
import { ReactNode } from "react";
import { DashboardFrame } from "@/src/features/dashboard";

// robots.txt already disallows /dashboard/, but that only stops crawling —
// this is what actually keeps a linked dashboard URL out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardFrame>{children}</DashboardFrame>;
}
