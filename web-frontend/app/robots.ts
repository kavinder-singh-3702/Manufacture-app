import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, auth-gated areas plus the auth flow itself (no commercial
        // search intent, and indexing /signin etc. only dilutes crawl budget)
        // should not be crawled. Actual de-indexing of these paths is done via
        // `robots: { index: false }` metadata on their layouts — robots.txt
        // disallow alone stops crawling but not indexing of an already-linked
        // URL.
        disallow: [
          "/dashboard/",
          "/admin/",
          "/signin",
          "/signup",
          "/welcome",
          "/forgot-password",
          "/reset-password",
          "/api-proxy/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
