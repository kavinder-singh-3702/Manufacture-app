import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/src/features/marketing/server/schema";
import { SITE_URL } from "@/src/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Site-wide defaults. `title.template` means every page's own `metadata.title`
// (e.g. "About ARVANN — India's manufacturing marketplace") renders as-is —
// pages already bake "ARVANN" into their titles — while any page that DOESN'T
// set a title (there shouldn't be any public one left, but this is the safety
// net) falls back to `default` instead of the old bare "ARVANN" placeholder
// that was previously the *only* title the whole site had.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s",
    default: "ARVANN — B2B Marketplace for Indian Manufacturers & Suppliers",
  },
  description:
    "Source products from verified Indian manufacturers, suppliers, traders, and exporters across 20+ industries on ARVANN — India's B2B marketplace and sourcing workspace.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "ARVANN",
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "ARVANN — B2B Marketplace for Indian Manufacturers & Suppliers",
    description:
      "Source products from verified Indian manufacturers, suppliers, traders, and exporters across 20+ industries.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARVANN — B2B Marketplace for Indian Manufacturers & Suppliers",
    description:
      "Source products from verified Indian manufacturers, suppliers, traders, and exporters across 20+ industries.",
  },
  robots: { index: true, follow: true },
  // Populate once a Google Search Console verification code exists — see
  // Phase 4 "Measurement" in the SEO plan. Left absent (not an empty string)
  // so Next omits the meta tag entirely rather than emitting a blank one.
};

// Colors the mobile browser chrome to match the app's light/dark themes, and
// declares viewport-fit=cover so iOS Safari lays content under the status
// bar / Dynamic Island / home indicator instead of clipping it — this is what
// makes `env(safe-area-inset-*)` resolve to a real value (see globals.css)
// instead of 0px, which is what caused the top bar to render underneath the
// status bar on iOS Safari.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // keep pinch-zoom available — never set userScalable: false
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#148DB2" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1B22" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the stored theme before paint to avoid a light→dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('arvann-theme')||'light';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.setAttribute('data-theme','dark');r.style.colorScheme='dark';}else{r.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        {/* Site-level schema, emitted once — Organization identity + the
            WebSite/SearchAction that makes ARVANN eligible for a sitelinks
            search box. Per-page schema (Product/Organization/Breadcrumb/FAQ)
            lives on the individual routes. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
