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
};

export default nextConfig;
