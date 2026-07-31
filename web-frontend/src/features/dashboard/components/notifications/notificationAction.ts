import type { NotificationAction } from "@/src/services/notification";

/**
 * Maps a notification's `action` (app-frontend/src/services/notificationNavigation.service.ts
 * handles the same shape on native) onto a real web destination. Only
 * routeNames that resolve to an actual page under app/dashboard/ get a link —
 * anything unrecognized returns null so the card renders no "Open" button
 * rather than a dead link.
 */
export const resolveNotificationHref = (
  action?: NotificationAction,
  data?: Record<string, unknown>
): string | null => {
  if (!action || !action.type || action.type === "none") return null;

  if (action.type === "url" && action.url) return action.url;
  if (action.type === "call" && action.phone) return `tel:${action.phone}`;

  if (action.type === "chat") {
    const conversationId = action.routeParams?.conversationId;
    if (typeof conversationId === "string") {
      return `/dashboard/chat?conversationId=${encodeURIComponent(conversationId)}`;
    }
    return "/dashboard/chat";
  }

  if (action.type === "route" && action.routeName) {
    const params = action.routeParams ?? {};

    switch (action.routeName) {
      case "QuoteCenter":
        return "/dashboard/quotes";
      case "CompanyVerification":
        return "/dashboard/verification";
      case "Notifications":
        return "/dashboard/notifications";
      case "ProductDetails": {
        const productId = params.productId;
        return typeof productId === "string" ? `/dashboard/products/${productId}` : null;
      }
      case "Main": {
        // Legacy admin notifications carry {kind, requestId} in `data` instead
        // of routeParams — mirrors the native fallback in
        // notificationNavigation.service.ts.
        const kind = data?.kind;
        const requestId = data?.requestId;
        if ((kind === "service" || kind === "business_setup") && typeof requestId === "string") {
          return null; // No web admin request-detail route exists yet.
        }
        return "/dashboard";
      }
      default:
        return null;
    }
  }

  return null;
};

/** True when the href is an external/tel link that should open in a new tab. */
export const isExternalHref = (href: string) => href.startsWith("http") || href.startsWith("tel:");
