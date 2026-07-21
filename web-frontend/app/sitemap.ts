import type { MetadataRoute } from "next";
import { productService } from "@/src/services/product";
import { PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";

// Regenerated hourly so newly published products/sellers enter the sitemap
// without a rebuild (matches the ISR cadence of the detail pages).
export const revalidate = 3600;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://arvann.in").replace(/\/+$/, "");

// Pull a generous page of marketplace products; the backend caps the limit, so
// this covers the catalogue without unbounded fan-out.
const PRODUCT_LIMIT = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = PRODUCT_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/products/category/${cat.id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  let sellerEntries: MetadataRoute.Sitemap = [];

  try {
    const res = await productService.list({ scope: "marketplace", limit: PRODUCT_LIMIT });
    const products = res.products ?? [];

    productEntries = products.map((p) => ({
      url: `${SITE_URL}/products/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    // Derive seller pages from the products' companies (no public "all sellers"
    // endpoint), deduplicated.
    const sellerIds = new Set<string>();
    for (const p of products) {
      if (p.company?._id) sellerIds.add(p.company._id);
    }
    sellerEntries = [...sellerIds].map((id) => ({
      url: `${SITE_URL}/sellers/${id}`,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // If the catalogue is unreachable at generation time, still emit the static
    // and category entries rather than failing the whole sitemap.
  }

  return [...staticEntries, ...categoryEntries, ...productEntries, ...sellerEntries];
}
