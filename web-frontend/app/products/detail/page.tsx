import { redirect } from "next/navigation";

// Legacy query-param route kept for old links/bookmarks. Redirects to the
// canonical, crawlable /products/[id] page.
type Props = { searchParams: Promise<{ productId?: string }> };

export default async function LegacyProductDetailRedirect({ searchParams }: Props) {
  const { productId } = await searchParams;
  redirect(productId ? `/products/${productId}` : "/products");
}
