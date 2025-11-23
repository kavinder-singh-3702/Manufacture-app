import { ScrollView, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Typography } from "../components/common/Typography";
import { useTheme } from "../hooks/useTheme";
import { QuickActionGrid, QuickAction } from "../components/home/QuickActionGrid";
import { CategorySections, CategorySectionData } from "../components/home/CategorySections";
import { MarketplacePulse, MarketplaceStat } from "../components/home/MarketplacePulse";
import { SpotlightPrograms, SpotlightProgram } from "../components/home/SpotlightPrograms";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const quickActions: QuickAction[] = [
  {
    id: "requirements",
    title: "Discover Verified Sellers",
    description: "Share your procurement goals with the sourcing desk.",
    cta: "Post requirement",
  },
  {
    id: "selling",
    title: "Boost your Sales",
    description: "Reach trusted buyers with export-ready support.",
    cta: "Start selling",
  },
] as const;

const categorySections: CategorySectionData[] = [
  {
    id: "food",
    title: "Food & Beverages",
    highlight: "Rice assortments",
    items: [
      { id: "basmati", label: "Basmati Rice", detail: "1121 & 1509 variants" },
      { id: "kolam", label: "Kolam Rice", detail: "Steam, raw & broken" },
      { id: "ponni", label: "Ponni Rice", detail: "South Indian staples" },
    ],
    theme: "#E9F6F4",
  },
  {
    id: "chemicals",
    title: "Chemicals & Minerals",
    highlight: "Industrial solvents",
    items: [
      {
        id: "acids",
        label: "Specialty Acids",
        detail: "Battery grade & lab grade",
      },
      {
        id: "powders",
        label: "Mineral Powders",
        detail: "Quartz, dolomite & more",
      },
      {
        id: "coatings",
        label: "Protective Coatings",
        detail: "High temperature & food safe",
      },
    ],
    theme: "#F2F4FF",
  },
  {
    id: "textiles",
    title: "Textiles & Apparel",
    highlight: "Premium cotton",
    items: [
      {
        id: "knits",
        label: "Organic Knits",
        detail: "GOTS certified partners",
      },
      {
        id: "uniforms",
        label: "Industrial Uniforms",
        detail: "Custom fits for shop floors",
      },
      {
        id: "technical",
        label: "Technical Fabrics",
        detail: "Fire retardant & antistatic",
      },
    ],
    theme: "#FFF4EC",
  },
] as const;

const marketplaceHighlights: MarketplaceStat[] = [
  { id: "buyers", value: "2.1k+", label: "Active buyers" },
  { id: "exports", value: "780+", label: "Verified exporters" },
  { id: "response", value: "4.2 hrs", label: "Avg response" },
] as const;

const spotlightPrograms: SpotlightProgram[] = [
  {
    id: "verified",
    title: "Verified Exporters Club",
    stat: "Invite-only",
    description:
      "Hands-on compliance, bonded warehouses, and curated buyer circles.",
  },
  {
    id: "logistics",
    title: "Logistics Concierge",
    stat: "Pan-India",
    description:
      "End-to-end movement, packaging, and insurance support for urgent orders.",
  },
] as const;

export const DashboardScreen = () => {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>

          <QuickActionGrid actions={quickActions} />

          <View>
            <SectionHeader title="Top Categories" actionLabel="View all" />
            <CategorySections sections={categorySections} />
          </View>

          <MarketplacePulse stats={marketplaceHighlights} />

          <SpotlightPrograms
            programs={spotlightPrograms}
            actionLabel="Talk to us"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SectionHeader = ({
  title,
  actionLabel,
}: {
  title: string;
  actionLabel?: string;
}) => {
  const { colors, radius } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Typography variant="subheading">{title}</Typography>
      {actionLabel ? (
        <TouchableOpacity
          style={[
            styles.sectionActionButton,
            { backgroundColor: colors.text, borderRadius: radius.pill },
          ]}
        >
          <Text style={[styles.sectionAction, { color: colors.textInverse }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
