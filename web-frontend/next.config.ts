import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// In dev, the static-export config is dropped and rewrites are enabled so that
// the browser sees same-origin API calls (avoiding cross-domain cookie issues).
// In production, the app is built as a static export and must reach the API
// directly via NEXT_PUBLIC_API_URL.
const nextConfig: NextConfig = isDev
  ? {
      async rewrites() {
        const target = process.env.NEXT_PUBLIC_DEV_PROXY_TARGET ?? "https://api.arvann.in";
        return [
          {
            source: "/api-proxy/:path*",
            destination: `${target}/api/:path*`,
          },
        ];
      },
    }
  : {
      output: "export",
      trailingSlash: true,
    };

export default nextConfig;
