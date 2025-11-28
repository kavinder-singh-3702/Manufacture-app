import { ScrollView, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

type KpiCardData = { id: string; label: string; value: string; delta: string; tone?: "positive" | "neutral" | "warning" };
type CategoryItem = { id: string; title: string; count: number; image: any; bgColor: string };
type PipelineItem = { id: string; title: string; progress: number; owner: string; status: "accepted" | "pending" | "cancelled" | "in-progress" };
type TaskItem = { id: string; title: string; owner: string; time: string; tag: string };
type UpdateItem = { id: string; title: string; detail: string; tag: string; tone?: "info" | "warning" };

const kpis: KpiCardData[] = [
  { id: "orders", label: "Open orders", value: "18", delta: "+3 this week", tone: "positive" },
  { id: "dispatch", label: "Ready to dispatch", value: "7", delta: "2 delayed", tone: "warning" },
  { id: "suppliers", label: "Active suppliers", value: "42", delta: "Stable", tone: "neutral" },
  { id: "qa", label: "QA passes", value: "96%", delta: "+5% vs avg", tone: "positive" },
];

// Category data for the grid (Blinkit-style)
const categories: CategoryItem[] = [
  { id: "raw-materials", title: "Raw Materials", count: 9, image: null, bgColor: "#E8F5E9" },
  { id: "packaging", title: "Packaging & Supplies", count: 11, image: null, bgColor: "#FFF3E0" },
  { id: "machinery", title: "Machinery Parts", count: 13, image: null, bgColor: "#FFEBEE" },
  { id: "safety", title: "Safety Equipment", count: 2, image: null, bgColor: "#E3F2FD" },
  { id: "chemicals", title: "Chemicals & Solvents", count: 4, image: null, bgColor: "#F3E5F5" },
  { id: "tools", title: "Tools & Hardware", count: 8, image: null, bgColor: "#FFF8E1" },
];

const pipeline: PipelineItem[] = [
  { id: "assembly", title: "Assembly line A", progress: 82, owner: "Floor", status: "in-progress" },
  { id: "finishing", title: "Finishing queue", progress: 54, owner: "Ops", status: "pending" },
  { id: "packing", title: "Packing bay", progress: 68, owner: "Floor", status: "accepted" },
];

const tasks: TaskItem[] = [
  { id: "qc", title: "QC approvals for batch #204", owner: "Quality", time: "Due in 2h", tag: "Compliance" },
  { id: "booking", title: "Lock trucking slots for Delhi", owner: "Logistics", time: "Today 5 PM", tag: "Dispatch" },
  { id: "inventory", title: "Count critical SKUs (motors)", owner: "Inventory", time: "Tomorrow 9 AM", tag: "Stock" },
];

const updates: UpdateItem[] = [
  { id: "alert", title: "Voltage dip flagged on Line A", detail: "Sensor auto-paused one station for 3 mins.", tag: "Alert", tone: "warning" },
  { id: "note", title: "Supplier Docs Cleared", detail: "Goyal Metals shared renewed compliance docs.", tag: "Supplier", tone: "info" },
];

export const DashboardScreen = () => {
  const { spacing, colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 16) return "Good afternoon";
    if (hour >= 16 && hour < 20) return "Good evening";
    return "Good night";
  };

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{firstName}</Text>
          </View>
          <HeroCard />
          <CategoryGrid items={categories} />
          <PipelineList items={pipeline} />
          <TaskBoard items={tasks} />
          <UpdatesPanel items={updates} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HeroCard = () => {
  const { spacing, radius } = useTheme();

  return (
    <LinearGradient
      colors={["#00B2FF", "#FF6B6B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroCard,
        {
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={styles.heroHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: "#FFFFFF" }]}>Production pulse</Text>
          <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.85)" }]}>
            Keep dispatches on time and floor running smooth.
          </Text>
        </View>
        <View
          style={[styles.heroBadge, { borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)" }]}
        >
          <Text style={[styles.heroBadgeText, { color: "#FFFFFF" }]}>On track</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <View style={[styles.statPillGlass, { borderRadius: radius.md }]}>
          <Text style={styles.statLabelWhite}>Next dispatch</Text>
          <Text style={styles.statValueWhite}>12:30 <Text style={styles.statValueSmall}>PM</Text></Text>
        </View>
        <View style={[styles.statPillGlass, { borderRadius: radius.md }]}>
          <Text style={styles.statLabelWhite}>Pending QC</Text>
          <Text style={styles.statValueWhite}>4 lots</Text>
        </View>
        <View style={[styles.statPillGlass, { borderRadius: radius.md }]}>
          <Text style={styles.statLabelWhite}>Inbound trucks</Text>
          <Text style={styles.statValueWhite}>3</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}>
          <LinearGradient
            colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.elegantButtonOuter, { borderRadius: radius.lg }]}
          >
            <LinearGradient
              colors={["rgba(0,178,255,0.25)", "rgba(255,107,107,0.25)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.elegantButtonInner, { borderRadius: radius.lg - 1.5 }]}
            >
              <Text style={styles.elegantButtonText}>Create order</Text>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}>
          <LinearGradient
            colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.elegantButtonOuter, { borderRadius: radius.lg }]}
          >
            <LinearGradient
              colors={["rgba(255,107,107,0.25)", "rgba(0,178,255,0.25)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.elegantButtonInner, { borderRadius: radius.lg - 1.5 }]}
            >
              <Text style={styles.elegantButtonText}>Plan capacity</Text>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const StatPill = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: muted ? "rgba(30, 33, 39, 0.6)" : "rgba(22, 24, 29, 0.8)",
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: muted ? colors.border : "rgba(108, 99, 255, 0.2)",
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: muted ? colors.textMuted : colors.text }]}>{value}</Text>
    </View>
  );
};

const CategoryGrid = ({ items }: { items: CategoryItem[] }) => {
  const { colors, spacing } = useTheme();

  // Create rows of 3 items each
  const rows = items.reduce<CategoryItem[][]>((acc, item, index) => {
    if (index % 3 === 0) {
      acc.push([item]);
    } else {
      acc[acc.length - 1].push(item);
    }
    return acc;
  }, []);

  // Emoji icons for each category
  const getIcon = (id: string) => {
    const icons: Record<string, string> = {
      "raw-materials": "🧱",
      "packaging": "📦",
      "machinery": "⚙️",
      "safety": "🦺",
      "chemicals": "🧪",
      "tools": "🔧",
    };
    return icons[id] || "📦";
  };

  // Different gradient colors for each category - bold and vibrant
  const getGradientColors = (id: string): { colors: [string, string]; shadow: string } => {
    const gradients: Record<string, { colors: [string, string]; shadow: string }> = {
      "raw-materials": { colors: ["#FF6B6B", "#FF8E53"], shadow: "#FF6B6B" },    // Coral to Orange
      "packaging": { colors: ["#FFB347", "#FFCC33"], shadow: "#FFB347" },        // Orange to Gold
      "machinery": { colors: ["#667eea", "#764ba2"], shadow: "#667eea" },        // Purple to Violet
      "safety": { colors: ["#11998e", "#38ef7d"], shadow: "#38ef7d" },           // Teal to Green
      "chemicals": { colors: ["#ee0979", "#ff6a00"], shadow: "#ee0979" },        // Pink to Orange
      "tools": { colors: ["#f2994a", "#f2c94c"], shadow: "#f2994a" },            // Orange to Yellow
    };
    return gradients[id] || { colors: ["#FF6B6B", "#FF8E53"], shadow: "#FF6B6B" };
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {rows.map((row, rowIndex) => (
        <View key={`cat-row-${rowIndex}`} style={styles.categoryRow}>
          {row.map((item) => {
            const gradient = getGradientColors(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.categoryItem}
                activeOpacity={0.7}
              >
                {/* Circular container with bold gradient border and glow */}
                <View style={[styles.categoryCircleOuter, { shadowColor: gradient.shadow }]}>
                  <LinearGradient
                    colors={gradient.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.categoryCircleGradient, { shadowColor: gradient.shadow }]}
                  >
                    <View style={[styles.categoryCircleInner, { backgroundColor: colors.background }]}>
                      <Text style={styles.categoryIcon}>{getIcon(item.id)}</Text>
                    </View>
                  </LinearGradient>

                  {/* Count badge with matching gradient */}
                  <View style={styles.countBadgeCircle}>
                    <LinearGradient
                      colors={gradient.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.countBadgeGradient, { shadowColor: gradient.shadow }]}
                    >
                      <Text style={styles.countBadgeText}>+{item.count}</Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.categoryTitleCircle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Fill empty spaces if row has less than 3 items */}
          {row.length < 3 &&
            Array(3 - row.length)
              .fill(null)
              .map((_, i) => <View key={`empty-${i}`} style={styles.categoryItem} />)}
        </View>
      ))}
    </View>
  );
};

const KpiGrid = ({ items }: { items: KpiCardData[] }) => {
  const { colors, spacing, radius } = useTheme();

  const toneStyles = (tone?: KpiCardData["tone"]) => {
    switch (tone) {
      case "positive":
        return { color: "#4ADE80", glow: "rgba(74, 222, 128, 0.15)", border: "rgba(74, 222, 128, 0.3)" };
      case "warning":
        return { color: "#FF8C3C", glow: "rgba(255, 140, 60, 0.15)", border: "rgba(255, 140, 60, 0.3)" };
      default:
        return { color: colors.textMuted, glow: "transparent", border: colors.border };
    }
  };

  const rows = items.reduce<KpiCardData[][]>((acc, item, index) => {
    if (index % 2 === 0) {
      acc.push([item]);
    } else {
      acc[acc.length - 1].push(item);
    }
    return acc;
  }, []);

  return (
    <View style={{ gap: spacing.sm }}>
      {rows.map((row, rowIndex) => (
        <View key={`kpi-row-${rowIndex}`} style={{ flexDirection: "row", gap: spacing.sm }}>
          {row.map((item) => {
            const tone = toneStyles(item.tone);
            return (
              <View
                key={item.id}
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: tone.border,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    flex: 1,
                    shadowColor: tone.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: item.tone === "positive" || item.tone === "warning" ? 0.15 : 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              >
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    backgroundColor: tone.glow,
                    borderTopRightRadius: radius.md,
                    borderBottomLeftRadius: 60,
                  }}
                />
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{item.label}</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.kpiDelta, { color: tone.color, fontWeight: "700" }]}>{item.delta}</Text>
              </View>
            );
          })}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
};

const PipelineList = ({ items }: { items: PipelineItem[] }) => {
  const { colors, spacing, radius } = useTheme();

  const getStatusInfo = (status: PipelineItem['status']) => {
    switch (status) {
      case 'accepted':
        return { label: 'Accepted', tone: 'success' as const, color: '#6BCF7F' };
      case 'pending':
        return { label: 'Pending', tone: 'warning' as const, color: '#F5D47E' };
      case 'cancelled':
        return { label: 'Cancelled', tone: 'error' as const, color: '#EF6B6B' };
      case 'in-progress':
        return { label: 'In Progress', tone: 'info' as const, color: '#7AC8F5' };
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Live pipeline" actionLabel="View all" />
      <View style={{ gap: spacing.sm }}>
        {items.map((item) => {
          const statusInfo = getStatusInfo(item.status);
          return (
            <View
              key={item.id}
              style={[
                styles.pipelineCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.md,
                },
              ]}
            >
              <View style={styles.pipelineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pipelineTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.pipelineMeta, { color: colors.textMuted }]}>Owner: {item.owner}</Text>
                </View>
                <Badge label={statusInfo.label} tone={statusInfo.tone} />
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: statusInfo.color }]} />
              </View>
              <Text style={[styles.pipelineMeta, { color: colors.textMuted }]}>{item.progress}% complete</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TaskBoard = ({ items }: { items: TaskItem[] }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Priority lane" actionLabel="Open board" />
      <View style={{ gap: spacing.sm }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.taskCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.taskHeader}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>{item.title}</Text>
              <Badge label={item.tag} tone="info" />
            </View>
            <View style={styles.taskFooter}>
              <Text style={[styles.taskMeta, { color: colors.textMuted }]}>{item.owner}</Text>
              <Text style={[styles.taskTime, { color: colors.warning }]}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const UpdatesPanel = ({ items }: { items: UpdateItem[] }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Alerts & updates" actionLabel="Activity" />
      <View style={{ gap: spacing.sm }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.updateCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.updateHeader}>
              <Badge label={item.tag} tone={item.tone === "warning" ? "warning" : "info"} />
              <Text style={[styles.updateTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.updateDetail, { color: colors.textMuted }]}>{item.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const SectionHeader = ({ title, actionLabel }: { title: string; actionLabel?: string }) => {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity style={[styles.sectionAction, { borderRadius: radius.pill, borderColor: colors.primary }]}>
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const Badge = ({ label, tone }: { label: string; tone?: "success" | "warning" | "info" | "error" }) => {
  const { colors, spacing, radius } = useTheme();

  const palette = {
    success: { bg: colors.badgeSuccess, text: '#6BCF7F', border: '#6BCF7F' },
    warning: { bg: colors.badgeWarning, text: '#F5D47E', border: '#F5D47E' },
    info: { bg: colors.badgeInfo, text: '#7AC8F5', border: '#7AC8F5' },
    error: { bg: colors.badgeError, text: '#EF6B6B', border: '#EF6B6B' },
  }[tone ?? "info"];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderWidth: 1,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  greeting: {
    fontSize: 16,
    fontWeight: "600",
  },
  userName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroCard: {
    overflow: "hidden",
  },
  // Category Grid Styles (Circular elegant design)
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  categoryCircleOuter: {
    position: "relative",
    marginBottom: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryCircleGradient: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  categoryCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: {
    fontSize: 32,
  },
  countBadgeCircle: {
    position: "absolute",
    top: -2,
    right: -2,
    zIndex: 1,
  },
  countBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  categoryTitleCircle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 90,
  },
  statPillGlass: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabelWhite: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  statValueWhite: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: "500",
  },
  glassButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    alignItems: "center",
  },
  glassButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  frostedButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    alignItems: "center",
  },
  frostedButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  elegantButtonOuter: {
    padding: 1.5,
  },
  elegantButtonInner: {
    paddingVertical: 14,
    alignItems: "center",
  },
  elegantButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  statPill: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  kpiGrid: {
  },
  kpiCard: {
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 4,
  },
  kpiDelta: {
    fontSize: 12,
    fontWeight: "700",
  },
  pipelineCard: {
    borderWidth: 1,
  },
  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pipelineTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  pipelineMeta: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  taskCard: {
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  taskTime: {
    fontSize: 13,
    fontWeight: "700",
  },
  updateCard: {
    borderWidth: 1,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  updateDetail: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionAction: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
