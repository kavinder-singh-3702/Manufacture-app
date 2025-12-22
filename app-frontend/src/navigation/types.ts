import { NavigatorScreenParams } from "@react-navigation/native";
import { RouteName, routes } from "./routes";

/**
 * Root stack - single navigation structure for all users
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
  Cart: undefined;
  CompanyProfile: { companyId?: string } | undefined;
  CompanyCreate: undefined;
  CompanyVerification: { companyId: string };
  VerificationSubmit: { companyId: string };
  Notifications: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  FilteredProducts: { filter: "low_stock" | "out_of_stock"; title: string };
  CategoryProducts: { categoryId: string; title: string; subCategory?: string };
  ProductDetails: { productId: string };
  ProductSearch: { initialQuery?: string } | undefined;
  UserPreferences: { userId: string; displayName?: string };
  // Chat screens
  Chat: { conversationId: string; recipientId?: string; recipientName: string; recipientPhone?: string };
};

/**
 * Unified tab navigation - contains all possible routes
 * Role-based filtering happens at runtime in the navigator
 */
export type MainTabParamList = {
  [K in RouteName]: undefined;
};

// Re-export for convenience
export { RouteName, routes };
