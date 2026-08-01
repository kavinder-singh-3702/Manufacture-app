import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/src/features/marketing/components/TopBar";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { INDUSTRY_CATEGORIES } from "@/src/features/product/utils/categories";
import { buildBreadcrumbJsonLd } from "@/src/features/marketing/server/schema";

export const metadata: Metadata = {
  title: "Industries — ARVANN B2B Marketplace",
  description:
    "Browse 20+ manufacturing industries on ARVANN, from food & beverage to defence & aerospace, and find verified Indian manufacturers, suppliers, and exporters in each.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesIndexPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Industries", path: "/industries" },
  ]);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <TopBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Industries</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ color: "var(--foreground)" }}>
            Manufacturing industries on ARVANN
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            ARVANN lists verified manufacturers, suppliers, traders, and exporters across 20+ industries.
            Pick an industry to browse its sub-categories and live product listings.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {INDUSTRY_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/industries/${cat.id}`}
                className="group flex items-start gap-3 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: cat.bg }}>
                  {cat.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-bold leading-tight" style={{ color: "var(--foreground)" }}>{cat.title}</p>
                  {cat.subCategories && (
                    <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
                      {cat.subCategories.length} sub-categories
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
