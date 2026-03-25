import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { paymentService, RazorpayErrorData } from "../../services/payment.service";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Checkout">;

// ─── Icons ───────────────────────────────────────────────────────────────────

const shieldIcon = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`;

const backIcon = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5"/>
    <path d="M12 19l-7-7 7-7"/>
  </svg>`;

const walletIcon = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="5" width="22" height="16" rx="2"/>
    <path d="M1 10h22"/>
    <circle cx="17" cy="15" r="1.5"/>
  </svg>`;

// ─── Component ───────────────────────────────────────────────────────────────

export const CheckoutScreen = () => {
  const { colors, spacing, nativeGradients } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const {
    amountInRupees,
    description,
    quoteId,
    productName,
    quantity,
    unitPrice,
  } = route.params;

  const displayAmount = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amountInRupees),
    [amountInRupees]
  );

  const handlePay = useCallback(async () => {
    setLoading(true);
    try {
      const result = await paymentService.checkout({
        amountInRupees,
        description: description ?? `Payment for ${productName ?? "order"}`,
        quoteId,
        prefill: {
          name: user?.displayName ?? "",
          email: user?.email ?? "",
          contact: user?.phone ?? "",
        },
        notes: {
          ...(quoteId ? { quoteId } : {}),
          ...(productName ? { productName } : {}),
        },
      });

      navigation.replace("OrderConfirmation", {
        success: true,
        paymentId: result.orderId,
        amount: amountInRupees,
        productName,
      });
    } catch (err: unknown) {
      // Razorpay user-cancelled errors have code 0 or 2
      const razorpayErr = err as RazorpayErrorData | undefined;
      if (razorpayErr?.code === 0 || razorpayErr?.code === 2) {
        toast.info("Payment cancelled");
        return;
      }

      const message =
        razorpayErr?.description ??
        (err instanceof Error ? err.message : "Payment failed");
      navigation.replace("OrderConfirmation", {
        success: false,
        amount: amountInRupees,
        productName,
        errorMessage: message,
      });
    } finally {
      setLoading(false);
    }
  }, [amountInRupees, description, navigation, productName, quoteId, toast, user]);

  return (
    <LinearGradient
      colors={nativeGradients.canvasSubtle}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
          activeOpacity={0.8}
        >
          <SvgXml xml={backIcon(colors.text)} width={20} height={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Order Summary</Text>

          {productName ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Product</Text>
              <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>
                {productName}
              </Text>
            </View>
          ) : null}

          {quantity ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Quantity</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{quantity}</Text>
            </View>
          ) : null}

          {unitPrice ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Unit Price</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(unitPrice)}
              </Text>
            </View>
          ) : null}

          {quoteId ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Quote Ref</Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>
                #{quoteId.slice(-8)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {displayAmount}
            </Text>
          </View>
        </View>

        {/* Payment Method Info */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.paymentMethodHeader}>
            <SvgXml xml={walletIcon(colors.primary)} width={22} height={22} />
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              Payment Method
            </Text>
          </View>
          <Text style={[styles.paymentMethodDesc, { color: colors.textMuted }]}>
            UPI, Debit/Credit Card, Net Banking, Wallets & more via Razorpay
          </Text>
        </View>

        {/* Security Badge */}
        <View style={[styles.securityRow, { backgroundColor: colors.primarySoft }]}>
          <SvgXml xml={shieldIcon(colors.primary)} width={18} height={18} />
          <Text style={[styles.securityText, { color: colors.primary }]}>
            Secured by Razorpay. 100% safe & encrypted.
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button (sticky bottom) */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.85}
          style={styles.payButtonWrap}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.payButtonText}>Pay {displayAmount}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 36 },

  content: { padding: 16, gap: 16 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowValue: { fontSize: 14, fontWeight: "700", maxWidth: "60%", textAlign: "right" },

  divider: { height: 1, marginVertical: 10 },

  totalLabel: { fontSize: 16, fontWeight: "900" },
  totalValue: { fontSize: 20, fontWeight: "900" },

  paymentMethodHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  paymentMethodDesc: { fontSize: 13, fontWeight: "600", lineHeight: 18 },

  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  securityText: { fontSize: 13, fontWeight: "700" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  payButtonWrap: { borderRadius: 14, overflow: "hidden" },
  payButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
});
