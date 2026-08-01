import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RolePageTemplate } from "@/src/features/marketing/components/RolePageTemplate";
import { SERVICE_CONTENT, getServiceContent } from "@/src/features/marketing/content/services";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/src/features/marketing/server/schema";

type Props = { params: Promise<{ service: string }> };

export function generateStaticParams() {
  return SERVICE_CONTENT.map((svc) => ({ service: svc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  const svc = getServiceContent(service);
  if (!svc) return { title: "Service not found — ARVANN" };
  return {
    title: `${svc.title} — ARVANN Business Services`,
    description: svc.intro.length > 155 ? `${svc.intro.slice(0, 154).trimEnd()}…` : svc.intro,
    alternates: { canonical: `/services/${service}` },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { service } = await params;
  const svc = getServiceContent(service);
  if (!svc) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: svc.title, path: `/services/${service}` },
  ];
  const breadcrumbLd = buildBreadcrumbJsonLd(crumbs);
  const faqLd = buildFaqJsonLd(svc.faqs);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <RolePageTemplate
        crumbs={crumbs}
        title={`${svc.icon} ${svc.title}`}
        intro={svc.intro}
        bullets={svc.bullets}
        faqs={svc.faqs}
        // Same reasoning as the role pages' CTA: link to /signup, not
        // straight into /dashboard — that route requires auth and bounces an
        // anonymous visitor to /signin anyway (this is the same class of bug
        // fixed in SiteFooter's old "Command Center" link).
        ctaLabel="Create your workspace →"
        ctaHref="/signup"
      />
    </>
  );
}
