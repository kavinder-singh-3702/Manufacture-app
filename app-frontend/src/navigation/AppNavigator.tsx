import { useEffect, useMemo } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from "react-native-screens";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { useAuth } from "../hooks/useAuth";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { AppearanceScreen } from "../screens/settings/AppearanceScreen";
import { NotificationPreferencesScreen } from "../screens/settings/NotificationPreferencesScreen";
import { MainTabs } from "./MainTabs";
import { useTheme } from "../hooks/useTheme";
import { RootStackParamList } from "./types";
import { CompanyVerificationScreen } from "../screens/verification/CompanyVerificationScreen";
import { VerificationSubmitScreen } from "../screens/verification/VerificationSubmitScreen";
import { CompanyProfileScreen } from "../screens/company/CompanyProfileScreen";
import { CompanyCreateScreen } from "../screens/company/CompanyCreateScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import {
  AddProductScreen,
  EditProductScreen,
  FilteredProductsScreen,
  CategoryProductsScreen,
  ProductDetailsScreen,
  ProductVariantsScreen,
  ProductSearchScreen,
  MyProductsScreen,
} from "../screens/inventory";
import { ChatScreen } from "../screens/chat";
import { CartScreen } from "../screens/cart";
import { UserPreferenceScreen } from "../screens/admin/UserPreferenceScreen";
import { UserActivityScreen } from "../screens/admin/UserActivityScreen";
import { CampaignStudioScreen } from "../screens/admin/CampaignStudioScreen";
import { NotificationStudioScreen } from "../screens/admin/NotificationStudioScreen";
import { ServiceDetailScreen, ServiceRequestScreen, ServicesOverviewScreen } from "../screens/services";
import { QuoteCenterScreen } from "../screens/quotes";
import { ProfitLossScreen } from "../screens/accounting/ProfitLossScreen";
import { GSTSummaryScreen } from "../screens/accounting/GSTSummaryScreen";
import { PartyOutstandingScreen } from "../screens/accounting/PartyOutstandingScreen";
import { TallyStatsScreen } from "../screens/tally/TallyStatsScreen";
import { SalesInvoiceScreen } from "../screens/tally/SalesInvoiceScreen";
import { PurchaseBillScreen } from "../screens/tally/PurchaseBillScreen";
import { ReceiptPaymentScreen } from "../screens/tally/ReceiptPaymentScreen";
import { TransactionListScreen } from "../screens/tally/TransactionListScreen";
import { rootNavigationRef } from "./navigationRef";
import { withAdminGuard } from "./components/AdminOnlyScreen";

enableScreens(true);

const RootStack = createNativeStackNavigator<RootStackParamList>();
const GuardedUserPreferenceScreen = withAdminGuard(UserPreferenceScreen);
const GuardedUserActivityScreen = withAdminGuard(UserActivityScreen);
const GuardedCampaignStudioScreen = withAdminGuard(CampaignStudioScreen);
const GuardedNotificationStudioScreen = withAdminGuard(NotificationStudioScreen);

/**
 * AppNavigator - Main navigation container
 *
 * This component handles:
 * 1. Authentication state (showing Auth screen when not logged in)
 * 2. Role-based navigation is handled within MainTabs
 *
 * The navigation flow:
 * - Not authenticated → AuthScreen
 * - Authenticated → MainTabs (which shows role-appropriate tabs)
 */
export const AppNavigator = () => {
  const { user, initializing, pendingVerificationRedirect, clearPendingVerificationRedirect } = useAuth();
  const { colors } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    }),
    [colors]
  );

  // Redirect to verification screen after manufacturer/trader signup
  useEffect(() => {
    if (!pendingVerificationRedirect || !user) return;

    const timer = setTimeout(() => {
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.navigate("CompanyVerification", {
          companyId: pendingVerificationRedirect,
        });
      }
      clearPendingVerificationRedirect();
    }, 100);

    return () => clearTimeout(timer);
  }, [pendingVerificationRedirect, user, clearPendingVerificationRedirect]);

  if (initializing) {
    return <FullScreenLoader />;
  }

  return (
    <NavigationContainer ref={rootNavigationRef} theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        {!user ? (
          // Not authenticated: Show login/signup screens
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : (
          // Authenticated: Show unified MainTabs (role-based content handled inside)
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="Help"
              component={ServicesOverviewScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Help" }}
            />
            <RootStack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: "modal", animation: "fade_from_bottom" }}
            />
            <RootStack.Screen
              name="Appearance"
              component={AppearanceScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="Cart"
              component={CartScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="CompanyProfile"
              component={CompanyProfileScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CompanyCreate"
              component={CompanyCreateScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CompanyVerification"
              component={CompanyVerificationScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="VerificationSubmit"
              component={VerificationSubmitScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="ProductSearch"
              component={ProductSearchScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="EditProduct"
              component={EditProductScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="FilteredProducts"
              component={FilteredProductsScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CategoryProducts"
              component={CategoryProductsScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="QuoteCenter"
              component={QuoteCenterScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Quotes" }}
            />
            <RootStack.Screen
              name="ProductVariants"
              component={ProductVariantsScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="ServiceRequest"
              component={ServiceRequestScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="UserPreferences"
              component={GuardedUserPreferenceScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="UserActivity"
              component={GuardedUserActivityScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CampaignStudio"
              component={GuardedCampaignStudioScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="NotificationStudio"
              component={GuardedNotificationStudioScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="MyProducts"
              component={MyProductsScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="ProfitLoss"
              component={ProfitLossScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Profit & Loss" }}
            />
            <RootStack.Screen
              name="GSTSummary"
              component={GSTSummaryScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "GST Summary" }}
            />
            <RootStack.Screen
              name="PartyOutstanding"
              component={PartyOutstandingScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Party Outstanding" }}
            />
            <RootStack.Screen
              name="TallyStats"
              component={TallyStatsScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Tally Stats" }}
            />
            <RootStack.Screen
              name="SalesInvoice"
              component={SalesInvoiceScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Sales Invoice" }}
            />
            <RootStack.Screen
              name="PurchaseBill"
              component={PurchaseBillScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Purchase Bill" }}
            />
            <RootStack.Screen
              name="ReceiptPayment"
              component={ReceiptPaymentScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Receipt/Payment" }}
            />
            <RootStack.Screen
              name="TransactionList"
              component={TransactionListScreen}
              options={{ presentation: "modal", animation: "slide_from_right", title: "Transactions" }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
