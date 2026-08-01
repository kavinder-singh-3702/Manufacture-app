import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/src/features/marketing/components/TopBar";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { SERVICE_CONTENT } from "@/src/features/marketing/content/services";
import { buildBreadcrumbJsonLd } from "@/src/features/marketing/server/schema";

export const metadata: Metadata = {
  title: "Business Services — ARVANN",
  description: "Accounting, inventory, verification, advertising, logistics, worker recruitment, and business setup services for manufacturers on ARVANN.",
  alternates: { canonical: "/services" },
};

export default function ServicesIndexPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <TopBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Services</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ color: "var(--foreground)" }}>
            Business services for manufacturers
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            Beyond the marketplace itself, ARVANN&apos;s workspace covers the operational side of running a manufacturing
            business — accounting, inventory, compliance verification, advertising, logistics, and workforce needs.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_CONTENT.map((svc) => (
              <Link
                key={svc.slug}
                href={`/services/${svc.slug}`}
                className="flex items-start gap-3 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <span className="text-2xl">{svc.icon}</span>
                <div>
                  <p className="font-bold" style={{ color: "var(--foreground)" }}>{svc.title}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--medium-gray)" }}>
                    {svc.bullets[0]?.detail}
                  </p>
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
