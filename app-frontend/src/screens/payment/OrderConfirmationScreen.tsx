import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "OrderConfirmation">;

// ─── Icons ───────────────────────────────────────────────────────────────────

const checkCircleIcon = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`;

const xCircleIcon = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>`;

const homeIcon = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 10.5 12 3l9 7.5"/>
    <path d="M5 9.5V21a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>
  </svg>`;

// ─── Component ───────────────────────────────────────────────────────────────

export const OrderConfirmationScreen = () => {
  const { colors, spacing, nativeGradients } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const { success, paymentId, amount, productName, errorMessage } = route.params;

  const displayAmount = useMemo(
    () =>
      amount
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(amount)
        : null,
    [amount]
  );

  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={nativeGradients.canvasSubtle}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={styles.centerContent}>
        {/* Status Icon */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: success
                ? colors.success + "18"
                : colors.error + "18",
            },
          ]}
        >
          <SvgXml
            xml={
              success
                ? checkCircleIcon(colors.success)
                : xCircleIcon(colors.error)
            }
            width={56}
            height={56}
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {success ? "Payment Successful!" : "Payment Failed"}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {success
            ? "Your order has been placed successfully. You'll receive a confirmation shortly."
            : errorMessage ?? "Something went wrong with your payment. Please try again."}
        </Text>

        {/* Details Card */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {displayAmount ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Amount</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {displayAmount}
              </Text>
            </View>
          ) : null}

          {productName ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Product</Text>
              <Text
                style={[styles.detailValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {productName}
              </Text>
            </View>
          ) : null}

          {success && paymentId ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Order ID
              </Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                #{paymentId.slice(-10)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={[styles.bottomArea, { paddingBottom: spacing.lg }]}>
        {success ? (
          <TouchableOpacity onPress={handleGoHome} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <SvgXml xml={homeIcon("#FFF")} width={20} height={20} />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={handleRetry} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoHome}
              activeOpacity={0.8}
              style={[styles.secondaryButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Go to Home
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 300,
  },

  detailsCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: { fontSize: 14, fontWeight: "600" },
  detailValue: { fontSize: 14, fontWeight: "800", maxWidth: "60%", textAlign: "right" },

  bottomArea: {
    paddingHorizontal: 16,
    gap: 12,
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
});
