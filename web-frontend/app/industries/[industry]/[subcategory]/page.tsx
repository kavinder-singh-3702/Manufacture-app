import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/src/features/marketing/components/TopBar";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { INDUSTRY_CATEGORIES, getCategoryMeta, getSubCategoryBySlug, slugifySubCategory } from "@/src/features/product/utils/categories";
import { getSubCategoryBlurb } from "@/src/features/marketing/content/industries";
import { getInitialListing } from "@/src/features/marketing/server/publicData";
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/src/features/marketing/server/schema";
import { isThinListing } from "@/src/features/marketing/server/seoGate";
import { ProductListRow } from "@/src/features/product/components/listing";

// Matches the industry/category page ISR cadence.
export const revalidate = 3600;

// A generous cap on how many of the parent industry's products we fetch to
// filter by sub-category client-side (see the comment on `getInitialListing`
// call below for why this can't be a server-side filter yet).
const SUBCATEGORY_FETCH_LIMIT = 100;

type Props = { params: Promise<{ industry: string; subcategory: string }> };

export function generateStaticParams() {
  return INDUSTRY_CATEGORIES.flatMap((cat) =>
    (cat.subCategories ?? []).map((sub) => ({ industry: cat.id, subcategory: slugifySubCategory(sub) }))
  );
}

async function loadSubCategoryPage(industry: string, subcategory: string) {
  const cat = getCategoryMeta(industry);
  const subLabel = getSubCategoryBySlug(cat, subcategory);
  if (!cat || !subLabel) return null;

  const blurb = getSubCategoryBlurb(industry, subLabel);
  if (!blurb) return null;

  // The product-list API has no `subCategory` filter (only `category`), so we
  // fetch a generous page of the parent industry's listings and filter by
  // subCategory here. Fine at today's catalogue size (single digits per
  // industry); if a `subCategory` query param is ever added to the backend,
  // switch this to a direct server-side filter instead of fetching+filtering.
  const listing = await getInitialListing({ category: industry, limit: SUBCATEGORY_FETCH_LIMIT });
  const products = (listing?.products ?? []).filter((p) => p.subCategory === subLabel);

  return { cat, subLabel, blurb, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry, subcategory } = await params;
  const data = await loadSubCategoryPage(industry, subcategory);
  if (!data) return { title: "Category not found — ARVANN" };

  const { cat, subLabel, products } = data;
  const thin = isThinListing(products.length);

  return {
    title: `${subLabel} — ${cat.title} | ARVANN`,
    description: `Source ${subLabel.toLowerCase()} from verified Indian manufacturers in ${cat.title} on ARVANN.`,
    alternates: { canonical: `/industries/${industry}/${subcategory}` },
    robots: thin ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function SubCategoryPage({ params }: Props) {
  const { industry, subcategory } = await params;
  const data = await loadSubCategoryPage(industry, subcategory);
  if (!data) notFound();

  const { cat, subLabel, blurb, products } = data;

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Industries", path: "/industries" },
    { name: cat.title, path: `/industries/${industry}` },
    { name: subLabel, path: `/industries/${industry}/${subcategory}` },
  ]);
  const itemListLd = products.length ? buildItemListJsonLd(products) : null;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}
      <TopBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--medium-gray)" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/industries" className="hover:underline">Industries</Link>
            <span aria-hidden>/</span>
            <Link href={`/industries/${industry}`} className="hover:underline">{cat.title}</Link>
            <span aria-hidden>/</span>
            <span style={{ color: "var(--foreground)" }}>{subLabel}</span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: cat.bg }}>
              {cat.icon}
            </span>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>{subLabel}</h1>
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                {products.length.toLocaleString("en-IN")} listing{products.length === 1 ? "" : "s"} · {cat.title}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{blurb}</p>

          <section className="mt-8">
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((p) => (
                  <ProductListRow key={p._id} product={p} href={`/products/${encodeURIComponent(p._id)}`} variant="row" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="text-4xl">🔍</div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No listings in {subLabel} yet</p>
                <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                  Browse all <Link href={`/industries/${industry}`} className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>{cat.title}</Link> listings instead.
                </p>
              </div>
            )}
          </section>

          <div className="mt-8">
            <Link href={`/industries/${industry}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--primary)" }}>
              ← View all {cat.title} products
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
