import { ReactNode } from "react";
import { TopBar } from "@/src/features/marketing/components/TopBar";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";

export default function SellersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <TopBar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
