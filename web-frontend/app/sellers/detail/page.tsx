import { redirect } from "next/navigation";

// Legacy query-param route kept for old links/bookmarks. Redirects to the
// canonical, crawlable /sellers/[id] page.
type Props = { searchParams: Promise<{ companyId?: string }> };

export default async function LegacySellerDetailRedirect({ searchParams }: Props) {
  const { companyId } = await searchParams;
  redirect(companyId ? `/sellers/${companyId}` : "/products");
}
