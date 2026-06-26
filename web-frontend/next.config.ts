import type { NextConfig } from "next";

// The app runs as a Next server (SSR + ISR) so that public product/seller
// detail pages can be server-rendered with per-item metadata, Open Graph tags
// and JSON-LD for SEO and link unfurls. Dynamic detail routes regenerate on a
// revalidate interval, so newly published products get a crawlable page without
// a full rebuild.
//
// In dev we proxy API calls through the same origin (avoids cross-domain cookie
// issues); in production the browser reaches the API directly via
// NEXT_PUBLIC_API_URL.
const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_DEV_PROXY_TARGET ?? "https://api.arvann.in";
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
  // Permanent (308) redirects from the legacy query-param detail routes to the
  // canonical clean URLs. Handled at the routing layer so crawlers and old
  // bookmarks get a real HTTP redirect (a page-level redirect() would only be a
  // soft client-side redirect under the streaming loading boundary).
  async redirects() {
    return [
      {
        source: "/products/detail",
        has: [{ type: "query", key: "productId", value: "(?<productId>[^&]+)" }],
        destination: "/products/:productId",
        permanent: true,
      },
      {
        source: "/sellers/detail",
        has: [{ type: "query", key: "companyId", value: "(?<companyId>[^&]+)" }],
        destination: "/sellers/:companyId",
        permanent: true,
      },
      // Fallbacks when the id is missing.
      { source: "/products/detail", destination: "/products", permanent: false },
      { source: "/sellers/detail", destination: "/products", permanent: false },
    ];
  },
};

export default nextConfig;
