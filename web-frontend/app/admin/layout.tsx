import type { Metadata } from "next";
import { ReactNode } from "react";
import { AdminFrame } from "@/src/features/admin-dashboard";

// robots.txt already disallows /admin/, but that only stops crawling — this
// is what actually keeps a linked admin URL out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
