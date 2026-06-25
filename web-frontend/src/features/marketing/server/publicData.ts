import { cache } from "react";
import { ApiError } from "@/src/lib/api-error";
import { productService } from "@/src/services/product";
import { companyService } from "@/src/services/company";
import type { Product } from "@/src/types/product";
import type { Company } from "@/src/types/company";

// Server-side loaders for public detail pages. Wrapped in React `cache` so the
// metadata pass and the render pass within a single request share one fetch.
// A genuine 404 resolves to null (→ notFound()); transient/other errors are
// rethrown so the route isn't cached as missing and retries on the next request.

export const getPublicProduct = cache(async (id: string): Promise<Product | null> => {
  try {
    return await productService.get(id, { scope: "marketplace", includeVariantSummary: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

export const getPublicCompany = cache(async (id: string): Promise<Company | null> => {
  try {
    const { company } = await companyService.get(id);
    return company;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

const clamp = (text: string | undefined, max: number): string | undefined =>
  text ? (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text) : undefined;

export const productMetaDescription = (product: Product): string =>
  clamp(product.description, 160) ??
  `Source ${product.name} from ${product.company?.displayName ?? "a verified manufacturer"} on the ARVANN marketplace.`;

export const companyMetaDescription = (company: Company): string =>
  clamp(company.description, 160) ??
  `Browse products from ${company.displayName}, a verified manufacturer on the ARVANN marketplace.`;

export const buildProductJsonLd = (product: Product, canonicalUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  ...(product.description ? { description: product.description } : {}),
  image: (product.images ?? []).map((img) => img.url).filter(Boolean),
  ...(product.category ? { category: product.category } : {}),
  ...(product.company?.displayName
    ? { brand: { "@type": "Brand", name: product.company.displayName } }
    : {}),
  offers: {
    "@type": "Offer",
    price: product.price.amount,
    priceCurrency: product.price.currency || "INR",
    availability: "https://schema.org/InStock",
    url: canonicalUrl,
  },
});

export const buildCompanyJsonLd = (company: Company, canonicalUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.displayName,
  ...(company.legalName ? { legalName: company.legalName } : {}),
  ...(company.description ? { description: company.description } : {}),
  ...(company.logoUrl ? { logo: company.logoUrl } : {}),
  url: canonicalUrl,
});
