import { CommonActions } from "@react-navigation/native";
import { navigateRoot, rootNavigationRef } from "../navigation/navigationRef";
import { Linking } from "react-native";
import type { NotificationAction } from "./notification.service";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Reset the root stack to Main with the requested nested tab/screen params.
 *
 * This is the correct handler when a notification's `routeName: 'Main'`
 * is tapped from inside a modal-presented screen like NotificationsScreen.
 * A plain `navigate("Main")` from a modal context can push Main as a new
 * stack entry *on top of* the modal — that's the "pop-up with the whole
 * dashboard" bug. CommonActions.reset closes any modal stack on top of
 * Main AND forwards the nested-screen params so the right tab is focused.
 */
const resetToMainWithParams = (params?: Record<string, unknown>) => {
  if (!rootNavigationRef.isReady()) return false;
  rootNavigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          params,
        },
      ],
    })
  );
  return true;
};

export const handleNotificationAction = async (action?: NotificationAction, data?: Record<string, unknown>) => {
  if (!action || !action.type || action.type === "none") {
    const notificationId = data?.notificationId;
    if (notificationId) {
      navigateRoot("Notifications");
      return true;
    }
    return false;
  }

  if (action.type === "route" && action.routeName) {
    const params = isObject(action.routeParams) ? action.routeParams : undefined;

    if (action.routeName === "QuoteCenter") {
      return navigateRoot("QuoteCenter", params as any);
    }

    if (action.routeName === "ProductDetails" && params && typeof params.productId === "string") {
      return navigateRoot("ProductDetails", params as any);
    }

    if (action.routeName === "CompanyVerification" && params && typeof params.companyId === "string") {
      return navigateRoot("CompanyVerification", params as any);
    }

    if (action.routeName === "Notifications") {
      return navigateRoot("Notifications");
    }

    // Phase 6: admin notifications can specify the new detail route directly.
    if (action.routeName === "AdminRequestDetail" && params && typeof params.id === "string" && typeof params.kind === "string") {
      return navigateRoot("AdminRequestDetail", params as any);
    }

    // Main / tab-switch deep links — reset cleanly so any modal stack
    // (NotificationsScreen, etc.) is dismissed and the requested tab is focused.
    if (action.routeName === "Main") {
      // Phase 6 fallback: legacy admin notifications use routeName="Main" but
      // include {kind, requestId} in the notification's `data` payload. If both
      // are present, deep-link directly to the request detail instead of dumping
      // the admin on a generic queue.
      const dataRequestId = typeof data?.requestId === "string" ? data.requestId : null;
      const dataKind = data?.kind === "service" || data?.kind === "business_setup" ? data.kind : null;
      if (dataRequestId && dataKind) {
        return navigateRoot("AdminRequestDetail", { id: dataRequestId, kind: dataKind } as any);
      }
      return resetToMainWithParams(params);
    }

    // Catch-all: forward params so navigation doesn't silently lose them.
    return navigateRoot(action.routeName as any, params as any);
  }

  if (action.type === "chat") {
    const params = isObject(action.routeParams) ? action.routeParams : {};
    if (
      typeof params.conversationId === "string" &&
      typeof params.recipientName === "string"
    ) {
      return navigateRoot("Chat", params as any);
    }
  }

  if (action.type === "url" && action.url) {
    try {
      await Linking.openURL(action.url);
      return true;
    } catch {
      return false;
    }
  }

  if (action.type === "call" && action.phone) {
    try {
      await Linking.openURL(`tel:${action.phone}`);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};
