import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { PRIVACY_POLICY_BLOCKS, type PolicyBlock } from "./privacyPolicyContent";

/**
 * Apple App Store Guideline 5.1.1 requires the privacy policy to be
 * accessible from inside the app (not just via a URL in App Store
 * Connect). This screen renders the canonical policy content offline
 * so a reviewer or user can always read it without a network round-trip.
 */
export const PrivacyPolicyScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator
      >
        {PRIVACY_POLICY_BLOCKS.map((block, index) => (
          <PolicyBlockView key={index} block={block} colors={colors} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const PolicyBlockView = ({ block, colors }: { block: PolicyBlock; colors: ReturnType<typeof useTheme>["colors"] }) => {
  switch (block.kind) {
    case "h1":
      return <Text style={[styles.h1, { color: colors.text }]}>{block.text}</Text>;
    case "h2":
      return <Text style={[styles.h2, { color: colors.text }]}>{block.text}</Text>;
    case "meta":
      return (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          <Text style={{ fontWeight: "800", color: colors.text }}>{block.label}:</Text> {block.value}
        </Text>
      );
    case "p":
      return <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{block.text}</Text>;
    case "bullet":
      return (
        <View style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: colors.textSecondary }]}>•</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{block.text}</Text>
        </View>
      );
    case "divider":
      return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  backHit: { flexDirection: "row", alignItems: "center", gap: 2, width: 60 },
  backText: { fontSize: 15, fontWeight: "700" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  h1: { fontSize: 24, fontWeight: "800", marginTop: 4, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: "800", marginTop: 20, marginBottom: 8 },
  meta: { fontSize: 13, fontWeight: "600", marginBottom: 4, lineHeight: 20 },
  paragraph: { fontSize: 14, fontWeight: "500", lineHeight: 22, marginBottom: 10 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6, paddingRight: 4 },
  bulletDot: { fontSize: 14, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, fontWeight: "500", lineHeight: 22 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
});
