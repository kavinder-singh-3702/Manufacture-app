import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/src/features/marketing/components/TopBar";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { INDUSTRY_CATEGORIES, getCategoryMeta, slugifySubCategory } from "@/src/features/product/utils/categories";
import { INDUSTRY_CONTENT } from "@/src/features/marketing/content/industries";
import { getInitialListing } from "@/src/features/marketing/server/publicData";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildItemListJsonLd } from "@/src/features/marketing/server/schema";
import { isThinListing } from "@/src/features/marketing/server/seoGate";
import { Card } from "@/src/components/ui/Surface";
import { ListingResults } from "@/src/features/product/components/listing";

// Regenerated hourly — matches the category/product page cadence, so a
// listing count crossing the thin-content threshold (see seoGate.ts) flips
// the page's indexability without a rebuild.
export const revalidate = 3600;

type Props = { params: Promise<{ industry: string }> };

export function generateStaticParams() {
  return INDUSTRY_CATEGORIES.map((cat) => ({ industry: cat.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  const cat = getCategoryMeta(industry);
  const content = INDUSTRY_CONTENT[industry];
  if (!cat || !content) return { title: "Industry not found — ARVANN" };

  const listing = await getInitialListing({ category: industry, limit: 1 });
  const thin = isThinListing(listing?.total ?? 0);

  return {
    title: `${cat.title} Manufacturers & Suppliers in India | ARVANN`,
    description: `Source ${cat.title.toLowerCase()} products from verified Indian manufacturers, suppliers, and exporters on ARVANN. ${cat.subCategories?.length ?? 0} sub-categories, direct RFQs.`,
    alternates: { canonical: `/industries/${industry}` },
    robots: thin ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function IndustryPage({ params }: Props) {
  const { industry } = await params;
  const cat = getCategoryMeta(industry);
  const content = INDUSTRY_CONTENT[industry];
  if (!cat || !content) notFound();

  const listing = await getInitialListing({ category: industry, limit: 20 });

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Industries", path: "/industries" },
    { name: cat.title, path: `/industries/${industry}` },
  ]);
  const faqLd = buildFaqJsonLd(content.faqs);
  const itemListLd = listing?.products.length ? buildItemListJsonLd(listing.products) : null;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}
      <TopBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--medium-gray)" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/industries" className="hover:underline">Industries</Link>
            <span aria-hidden>/</span>
            <span style={{ color: "var(--foreground)" }}>{cat.title}</span>
          </nav>

          {/* Header */}
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: cat.bg }}>
              {cat.icon}
            </span>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
                {cat.title} Manufacturers &amp; Suppliers in India
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
                {(listing?.total ?? 0).toLocaleString("en-IN")} listing{(listing?.total ?? 0) === 1 ? "" : "s"} on ARVANN
              </p>
            </div>
          </div>

          {/* Editorial intro */}
          <p className="mt-6 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {content.intro}
          </p>

          {/* Sub-categories */}
          {cat.subCategories && cat.subCategories.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>Sub-categories</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cat.subCategories.map((sub) => (
                  <Link
                    key={sub}
                    href={`/industries/${industry}/${slugifySubCategory(sub)}`}
                    className="rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }}
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Live listings — the interactive grid (ListingResults), not the
              full PublicMarketplace (which renders its own competing <h1>). */}
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Products in {cat.title}
            </h2>
            <ListingResults
              category={industry}
              initial={listing}
              emptyIcon="🏭"
              emptyTitle="No listings yet"
              emptySubtitle="Check back soon, or browse the full marketplace."
            />
          </section>

          {/* Buyer's guide */}
          <section className="mt-10">
            <Card padding="lg">
              <h2 className="mb-2 text-lg font-bold" style={{ color: "var(--foreground)" }}>What to check when sourcing</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{content.buyerGuide}</p>
            </Card>
          </section>

          {/* FAQ — plain <details>/<summary>, no client JS required */}
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>Frequently asked questions</h2>
            <div className="space-y-2">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
