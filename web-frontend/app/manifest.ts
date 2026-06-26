import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest and auto-linked by Next, enabling
// "Add to Home Screen" / installability with brand name, colors and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARVANN",
    short_name: "ARVANN",
    description: "Source products from verified Indian manufacturers on the ARVANN marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFB",
    theme_color: "#148DB2",
    icons: [
      { src: "/arvann-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/arvann-icon.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
    ],
  };
}
