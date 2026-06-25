import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProductDetail } from "@/src/features/marketing/components/PublicProductDetail";
import {
  buildProductJsonLd,
  getPublicProduct,
  productMetaDescription,
} from "@/src/features/marketing/server/publicData";

// Server-rendered with incremental regeneration: a newly published product gets
// a crawlable page on first request, then is cached and refreshed hourly.
export const revalidate = 3600;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://arvann.in").replace(/\/+$/, "");

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getPublicProduct(id);
  if (!product) {
    return { title: "Product not found — ARVANN" };
  }
  const description = productMetaDescription(product);
  const path = `/products/${id}`;
  const cover = product.images?.find((img) => img.url)?.url;
  return {
    title: `${product.name} — ARVANN`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: product.name,
      description,
      url: path,
      type: "website",
      images: cover ? [{ url: cover, alt: product.name }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getPublicProduct(id);
  if (!product) notFound();

  const jsonLd = buildProductJsonLd(product, `${SITE_URL}/products/${id}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicProductDetail productId={id} initialProduct={product} />
    </>
  );
}
