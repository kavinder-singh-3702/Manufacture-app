import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RolePageTemplate } from "@/src/features/marketing/components/RolePageTemplate";
import { getRoleContent } from "@/src/features/marketing/content/roles";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/src/features/marketing/server/schema";

const SLUG = "traders";

export const metadata: Metadata = (() => {
  const role = getRoleContent(SLUG);
  if (!role) return { title: "ARVANN" };
  return {
    title: `${role.title} on ARVANN — India's B2B Marketplace`,
    description: `Source and list products, manage RFQs both ways, ${role.audienceLabel} on ARVANN.`,
    alternates: { canonical: `/${SLUG}` },
  };
})();

export default function TradersPage() {
  const role = getRoleContent(SLUG);
  if (!role) notFound();

  const breadcrumbLd = buildBreadcrumbJsonLd([{ name: "Home", path: "/" }, { name: role.title, path: `/${SLUG}` }]);
  const faqLd = buildFaqJsonLd(role.faqs);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <RolePageTemplate
        crumbs={[{ name: "Home", path: "/" }, { name: role.title, path: `/${SLUG}` }]}
        title="Traders — Buy and Resell on One Platform"
        intro={role.intro}
        bullets={role.bullets}
        faqs={role.faqs}
        ctaLabel="Start free →"
        ctaHref="/signup"
      />
    </>
  );
}
