import type { MetadataRoute } from "next";
import { productService } from "@/src/services/product";
import { companyService } from "@/src/services/company";
import { INDUSTRY_CATEGORIES, slugifySubCategory } from "@/src/features/product/utils/categories";
import { SITE_URL } from "@/src/lib/site";
import { isThinListing } from "@/src/features/marketing/server/seoGate";
import { ROLE_CONTENT } from "@/src/features/marketing/content/roles";
import { SERVICE_CONTENT } from "@/src/features/marketing/content/services";

// Regenerated hourly so newly published products/sellers enter the sitemap
// without a rebuild (matches the ISR cadence of the detail pages).
export const revalidate = 3600;

// Pull a generous page of marketplace products; the backend caps the limit, so
// this covers the catalogue without unbounded fan-out.
const PRODUCT_LIMIT = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/industries`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Role pages (/manufacturers, /suppliers, ...) and service pages
  // (/services/[service]) are evergreen editorial content, not tied to
  // current listing counts — always indexable, no thin-content gate.
  const roleEntries: MetadataRoute.Sitemap = ROLE_CONTENT.map((role) => ({
    url: `${SITE_URL}/${role.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
  const serviceEntries: MetadataRoute.Sitemap = SERVICE_CONTENT.map((svc) => ({
    url: `${SITE_URL}/services/${svc.slug}`,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  let sellerEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];
  let subCategoryEntries: MetadataRoute.Sitemap = [];

  try {
    const res = await productService.list({ scope: "marketplace", limit: PRODUCT_LIMIT });
    const products = res.products ?? [];

    productEntries = products.map((p) => ({
      url: `${SITE_URL}/products/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    // Derive seller pages from the products' companies (no public "list all
    // sellers" endpoint), deduplicated — then confirm each one actually
    // resolves through the public profile endpoint before listing it. A
    // product's embedded `company` doesn't carry the company's operational
    // `status`, so without this check a company that's since been
    // suspended/archived (getPublicCompany's gate — see
    // company.service.js) would still get a sitemap entry that 404s.
    const sellerIds = new Set<string>();
    for (const p of products) {
      if (p.company?._id) sellerIds.add(p.company._id);
    }
    const sellerChecks = await Promise.all(
      [...sellerIds].map(async (id) => {
        try {
          await companyService.getPublic(id);
          return id;
        } catch {
          return null;
        }
      })
    );
    sellerEntries = sellerChecks
      .filter((id): id is string => id !== null)
      .map((id) => ({ url: `${SITE_URL}/sellers/${id}`, changeFrequency: "weekly", priority: 0.5 }));

    // Industry + sub-category pages, gated by the same thin-content threshold
    // as their own `generateMetadata` (see seoGate.ts) so a sitemap entry
    // never points at a page that's itself set to noindex. One fetch per
    // industry serves both: `pagination.total` for the industry-level count,
    // and the returned products (limit generous enough for today's catalogue
    // size) filtered by `subCategory` for the sub-category count — the
    // product-list API has no `subCategory` query filter (see the
    // sub-category page's own comment on this), so this is the same
    // fetch-then-filter approach, just done once per industry instead of
    // once per sub-category.
    const industryData = await Promise.all(
      INDUSTRY_CATEGORIES.map(async (cat) => {
        try {
          const r = await productService.list({ scope: "marketplace", category: cat.id, limit: 100 });
          return { cat, total: r.pagination?.total ?? 0, products: r.products ?? [] };
        } catch {
          return { cat, total: 0, products: [] };
        }
      })
    );

    categoryEntries = industryData
      .filter(({ total }) => !isThinListing(total))
      .map(({ cat }) => ({ url: `${SITE_URL}/industries/${cat.id}`, changeFrequency: "daily", priority: 0.7 }));

    subCategoryEntries = industryData.flatMap(({ cat, products: catProducts }) =>
      (cat.subCategories ?? [])
        .map((sub) => ({
          slug: slugifySubCategory(sub),
          count: catProducts.filter((p) => p.subCategory === sub).length,
        }))
        .filter(({ count }) => !isThinListing(count))
        .map(({ slug }) => ({
          url: `${SITE_URL}/industries/${cat.id}/${slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        }))
    );
  } catch {
    // If the catalogue is unreachable at generation time, still emit the
    // static/role/service entries rather than failing the whole sitemap.
  }

  return [
    ...staticEntries,
    ...roleEntries,
    ...serviceEntries,
    ...categoryEntries,
    ...subCategoryEntries,
    ...productEntries,
    ...sellerEntries,
  ];
}
