import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { navigateRoot } from "../navigation/navigationRef";
import type { AdFeedCard } from "./ad.service";

// Single place every ad surface (dashboard hero, login popup, cross-sell) routes
// a tap through — internal ads navigate to ProductDetails, external ads open an
// in-app browser so the visitor never fully leaves the app. Mirrors the web
// service's adDestination.ts.
export const openAdDestination = async (card: AdFeedCard) => {
  if (card.adSource === "external" && card.external?.destinationUrl) {
    try {
      await WebBrowser.openBrowserAsync(card.external.destinationUrl);
    } catch {
      // Best-effort fallback if the in-app browser fails to launch.
      Linking.openURL(card.external.destinationUrl).catch(() => {});
    }
    return;
  }
  if (card.product?.id) {
    navigateRoot("ProductDetails", { productId: card.product.id });
  }
};
