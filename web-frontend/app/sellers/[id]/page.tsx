import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerProfile } from "@/src/features/marketing/components/SellerProfile";
import {
  companyMetaDescription,
  getPublicCompany,
} from "@/src/features/marketing/server/publicData";
import { buildCompanyJsonLd, buildBreadcrumbJsonLd } from "@/src/features/marketing/server/schema";
import { SITE_URL } from "@/src/lib/site";

// Server-rendered with incremental regeneration so seller pages are crawlable
// and refresh hourly without a full rebuild.
export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await getPublicCompany(id);
  if (!company) {
    return { title: "Seller not found — ARVANN" };
  }
  const description = companyMetaDescription(company);
  const path = `/sellers/${id}`;
  return {
    title: `${company.displayName} — Seller on ARVANN`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: company.displayName,
      description,
      url: path,
      type: "website",
      images: company.logoUrl ? [{ url: company.logoUrl, alt: company.displayName }] : undefined,
    },
    twitter: {
      card: company.logoUrl ? "summary_large_image" : "summary",
      title: company.displayName,
      description,
      images: company.logoUrl ? [company.logoUrl] : undefined,
    },
  };
}

export default async function SellerDetailPage({ params }: Props) {
  const { id } = await params;
  const company = await getPublicCompany(id);
  if (!company) notFound();

  const jsonLd = buildCompanyJsonLd(company, `${SITE_URL}/sellers/${id}`);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Sellers", path: "/products" },
    { name: company.displayName, path: `/sellers/${id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <SellerProfile companyId={id} initialCompany={company} />
    </>
  );
}
