import { navigateRoot } from "../navigation/navigationRef";
import { Linking } from "react-native";
import type { NotificationAction } from "./notification.service";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

    return navigateRoot("Main");
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
