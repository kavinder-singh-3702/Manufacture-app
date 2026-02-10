import { NavigatorScreenParams } from "@react-navigation/native";
import { RouteName, routes } from "./routes";
import { ServiceType } from "../services/serviceRequest.service";

/**
 * Root stack - single navigation structure for all users
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Help: undefined;
  Profile: undefined;
  Appearance: undefined;
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
  ProductDetails: { productId: string; product?: any };
  ProductVariants: { productId: string; productName?: string; scope?: "company" | "marketplace" };
  ProductSearch: { initialQuery?: string } | undefined;
  UserPreferences: { userId: string; displayName?: string };
  CampaignStudio: undefined;
  // Chat screens
  Chat: { conversationId: string; recipientId?: string; recipientName: string; recipientPhone?: string };
  ServiceRequest: { serviceType?: ServiceType };
  ServiceDetail: { serviceType: ServiceType };
  MyProducts: { initialQuery?: string; initialStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock" } | undefined;
  // Accounting Reports
  ProfitLoss: undefined;
  GSTSummary: undefined;
  PartyOutstanding: undefined;
  // Tally
  TallyStats: undefined;
  SalesInvoice: undefined;
  PurchaseBill: undefined;
  ReceiptPayment: { type: 'receipt' | 'payment' };
  TransactionList: undefined;
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
