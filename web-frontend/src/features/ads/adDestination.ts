import type { useRouter } from "next/navigation";
import type { AdDestination } from "./adView";

type Router = Pick<ReturnType<typeof useRouter>, "push">;

// Single place every ad surface routes a click through — internal ads use the
// SPA router, external ads open in a new tab so the visitor never leaves the
// site's own navigation stack. Mirrors the app's adDestination.ts.
export const openAdDestination = (destination: AdDestination, router: Router) => {
  if (destination.kind === "external") {
    window.open(destination.url, "_blank", "noopener,noreferrer");
    return;
  }
  router.push(destination.href);
};
