import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Product } from "../../../services/product.service";
import type { RootStackParamList } from "../../../navigation/types";

/**
 * Single source of truth for the "Boost" CTA on owner product cards. Routes
 * to the existing advertisement ServiceRequest flow — admins still mediate
 * via AdStudio after approval, but the seller-facing intake is just a
 * service request, so this stays consistent with the rest of the services
 * pipeline (and AdStudio remains admin-only).
 *
 * The card derives ownership internally from `currentUserId`. Consumer
 * screens just pass this helper (or one identical to it) as `onBoostPress`.
 */
export const startProductBoost = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  product: Product
) => {
  navigation.navigate("ServiceRequest", {
    serviceType: "advertisement",
    prefillProductId: product._id,
    prefillProductName: product.name,
    prefillObjective: `Promote ${product.name} to relevant buyers`,
  });
};
