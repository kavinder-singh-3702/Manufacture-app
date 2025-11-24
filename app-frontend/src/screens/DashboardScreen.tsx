import { ScrollView, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

type KpiCardData = { id: string; label: string; value: string; delta: string; tone?: "positive" | "neutral" | "warning" };
type PipelineItem = { id: string; title: string; progress: number; owner: string; status: "accepted" | "pending" | "cancelled" | "in-progress" };
type TaskItem = { id: string; title: string; owner: string; time: string; tag: string };
type UpdateItem = { id: string; title: string; detail: string; tag: string; tone?: "info" | "warning" };

const kpis: KpiCardData[] = [
  { id: "orders", label: "Open orders", value: "18", delta: "+3 this week", tone: "positive" },
  { id: "dispatch", label: "Ready to dispatch", value: "7", delta: "2 delayed", tone: "warning" },
  { id: "suppliers", label: "Active suppliers", value: "42", delta: "Stable", tone: "neutral" },
  { id: "qa", label: "QA passes", value: "96%", delta: "+5% vs avg", tone: "positive" },
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
          <KpiGrid items={kpis} />
          <PipelineList items={pipeline} />
          <TaskBoard items={tasks} />
          <UpdatesPanel items={updates} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HeroCard = () => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.secondary,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
        },
      ]}
    >
      <View style={styles.heroHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.textOnSecondary }]}>Production pulse</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textOnSecondary }]}>
            Keep dispatches on time and floor running smooth.
          </Text>
        </View>
        <View style={[styles.heroBadge, { backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.primary }]}>
          <Text style={[styles.heroBadgeText, { color: colors.primary }]}>On track</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <StatPill label="Next dispatch" value="12:30 PM" />
        <StatPill label="Pending QC" value="4 lots" muted />
        <StatPill label="Inbound trucks" value="3" />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.secondaryLight, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.primaryButtonText, { color: colors.text }]}>Create order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.backgroundTertiary },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Plan capacity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StatPill = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: muted ? colors.secondaryLight : colors.backgroundTertiary,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const KpiGrid = ({ items }: { items: KpiCardData[] }) => {
  const { colors, spacing, radius } = useTheme();

  const toneColor = (tone?: KpiCardData["tone"]) =>
    ({
      positive: colors.success,
      warning: colors.warning,
      neutral: colors.textMuted,
      undefined: colors.textMuted,
    }[tone ?? "neutral"]);

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
          {row.map((item) => (
            <View
              key={item.id}
              style={[
                styles.kpiCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  flex: 1,
                },
              ]}
            >
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{item.label}</Text>
              <Text style={[styles.kpiValue, { color: colors.text }]}>{item.value}</Text>
              <Text style={[styles.kpiDelta, { color: toneColor(item.tone) }]}>{item.delta}</Text>
            </View>
          ))}
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
