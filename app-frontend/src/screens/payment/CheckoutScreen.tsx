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
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../components/ui/Toast";
import { InputField } from "../../components/common/InputField";
import { paymentService, RazorpayErrorData, CheckoutAddressInput, CheckoutLineInput } from "../../services/payment.service";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Checkout">;

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

const formatCurrency = (amount: number, currency: string = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const sanitizeAddress = (address?: Partial<CheckoutAddressInput> | null): CheckoutAddressInput => ({
  line1: String(address?.line1 || "").trim(),
  line2: String(address?.line2 || "").trim(),
  city: String(address?.city || "").trim(),
  state: String(address?.state || "").trim(),
  postalCode: String(address?.postalCode || "").trim(),
  country: String(address?.country || "").trim(),
});

const isCompleteAddress = (address: CheckoutAddressInput) =>
  Boolean(address.line1 && address.city && address.state && address.postalCode && address.country);

const getOrderLabel = (lines: CheckoutLineInput[], fallback?: string) => {
  if (fallback) return fallback;
  if (lines.length === 1) return lines[0].productName || "Order";
  return `${lines.length} products`;
};

export const CheckoutScreen = () => {
  const { colors, spacing, nativeGradients } = useTheme();
  const { user } = useAuth();
  const { removeManyFromCart } = useCart();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { source, lines, shippingAddress, description, productName } = route.params;
  const [addressDraft, setAddressDraft] = useState<CheckoutAddressInput>(() =>
    sanitizeAddress(shippingAddress || ((user?.address as Partial<CheckoutAddressInput> | undefined) ?? undefined))
  );

  const payableCurrency = useMemo(
    () => lines.find((line) => line.currency)?.currency || "INR",
    [lines]
  );
  const totalAmount = useMemo(
    () =>
      lines.reduce((sum, line) => sum + Number(line.unitPrice || 0) * Number(line.quantity || 0), 0),
    [lines]
  );
  const displayAmount = useMemo(() => formatCurrency(totalAmount, payableCurrency), [payableCurrency, totalAmount]);
  const hasCompleteShippingAddress = useMemo(() => isCompleteAddress(addressDraft), [addressDraft]);
  const orderLabel = useMemo(() => getOrderLabel(lines, productName), [lines, productName]);

  const updateAddressField = useCallback((field: keyof CheckoutAddressInput, value: string) => {
    setAddressDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePay = useCallback(async () => {
    const normalizedAddress = sanitizeAddress(addressDraft);
    if (!isCompleteAddress(normalizedAddress)) {
      toast.error("Shipping address required", "Please complete the delivery address before paying.");
      return;
    }

    setLoading(true);
    try {
      const result = await paymentService.checkout({
        source,
        lines,
        shippingAddress: normalizedAddress,
        description: description ?? `Payment for ${orderLabel}`,
        prefill: {
          name: user?.displayName ?? "",
          email: user?.email ?? "",
          contact: user?.phone ?? "",
        },
      });

      if (source === "cart") {
        const paidLineKeys = lines.map((line) => line.lineKey).filter((lineKey): lineKey is string => Boolean(lineKey));
        removeManyFromCart(paidLineKeys);
      }

      navigation.replace("OrderConfirmation", {
        success: true,
        paymentId: result.orderId,
        amount: result.order?.totals?.total ?? totalAmount,
        productName: orderLabel,
        statusMessage:
          result.paymentStatus === "authorized"
            ? "Payment is authorized and waiting for final capture confirmation."
            : "Your order has been placed successfully. You'll receive a confirmation shortly.",
      });
    } catch (err: unknown) {
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
        amount: totalAmount,
        productName: orderLabel,
        errorMessage: message,
      });
    } finally {
      setLoading(false);
    }
  }, [addressDraft, description, lines, navigation, orderLabel, removeManyFromCart, source, toast, totalAmount, user]);

  return (
    <LinearGradient
      colors={nativeGradients.canvasSubtle}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
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

          {lines.map((line, index) => {
            const lineTotal = Number(line.unitPrice || 0) * Number(line.quantity || 0);
            return (
              <View key={`${line.productId}-${line.variantId || "base"}-${index}`} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>
                    {line.productName || `Product ${index + 1}`}
                  </Text>
                  {line.variantTitle ? (
                    <Text style={[styles.lineMeta, { color: colors.textMuted }]}>{line.variantTitle}</Text>
                  ) : null}
                  <Text style={[styles.lineMeta, { color: colors.textMuted }]}>
                    Qty {line.quantity} × {formatCurrency(Number(line.unitPrice || 0), line.currency || payableCurrency)}
                  </Text>
                </View>
                <Text style={[styles.rowValue, { color: colors.text }]}>{formatCurrency(lineTotal, line.currency || payableCurrency)}</Text>
              </View>
            );
          })}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{displayAmount}</Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Shipping Address</Text>

          {hasCompleteShippingAddress ? (
            <View style={styles.addressSummary}>
              <Text style={[styles.addressLine, { color: colors.text }]}>{addressDraft.line1}</Text>
              {addressDraft.line2 ? (
                <Text style={[styles.addressLine, { color: colors.textMuted }]}>{addressDraft.line2}</Text>
              ) : null}
              <Text style={[styles.addressLine, { color: colors.textMuted }]}>
                {[addressDraft.city, addressDraft.state, addressDraft.postalCode].filter(Boolean).join(", ")}
              </Text>
              <Text style={[styles.addressLine, { color: colors.textMuted }]}>{addressDraft.country}</Text>
            </View>
          ) : (
            <>
              <InputField
                label="Address line 1"
                placeholder="Street address"
                value={addressDraft.line1}
                onChangeText={(value) => updateAddressField("line1", value)}
                required
              />
              <InputField
                label="Address line 2"
                placeholder="Apartment, suite, landmark (optional)"
                value={addressDraft.line2}
                onChangeText={(value) => updateAddressField("line2", value)}
              />
              <View style={styles.doubleRow}>
                <View style={styles.doubleCell}>
                  <InputField
                    label="City"
                    placeholder="City"
                    value={addressDraft.city}
                    onChangeText={(value) => updateAddressField("city", value)}
                    required
                  />
                </View>
                <View style={styles.doubleCell}>
                  <InputField
                    label="State"
                    placeholder="State"
                    value={addressDraft.state}
                    onChangeText={(value) => updateAddressField("state", value)}
                    required
                  />
                </View>
              </View>
              <View style={styles.doubleRow}>
                <View style={styles.doubleCell}>
                  <InputField
                    label="Postal code"
                    placeholder="PIN / ZIP"
                    value={addressDraft.postalCode}
                    onChangeText={(value) => updateAddressField("postalCode", value)}
                    required
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.doubleCell}>
                  <InputField
                    label="Country"
                    placeholder="Country"
                    value={addressDraft.country}
                    onChangeText={(value) => updateAddressField("country", value)}
                    required
                  />
                </View>
              </View>
            </>
          )}
        </View>

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
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Payment Method</Text>
          </View>
          <Text style={[styles.paymentMethodDesc, { color: colors.textMuted }]}>
            UPI, Debit/Credit Card, Net Banking, Wallets and more via Razorpay.
          </Text>
        </View>

        <View style={[styles.securityRow, { backgroundColor: colors.primarySoft }]}>
          <SvgXml xml={shieldIcon(colors.primary)} width={18} height={18} />
          <Text style={[styles.securityText, { color: colors.primary }]}>
            Secured by Razorpay. Order totals are calculated on the server before payment.
          </Text>
        </View>
      </ScrollView>

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
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  lineMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  addressSummary: {
    gap: 4,
  },
  addressLine: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  doubleRow: {
    flexDirection: "row",
    gap: 12,
  },
  doubleCell: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentMethodDesc: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  payButtonWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  payButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
