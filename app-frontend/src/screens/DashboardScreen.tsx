import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { inventoryService } from "../services/inventory.service";
import { adminService, AdminStats } from "../services/admin.service";
import { RootStackParamList } from "../navigation/types";
import { routes } from "../navigation/routes";
import { AppRole } from "../constants/roles";

// ============================================================
// TYPES
// ============================================================
type CategoryItem = { id: string; title: string; count: number; image: any; bgColor: string };
type PipelineItem = { id: string; title: string; progress: number; owner: string; status: "accepted" | "pending" | "cancelled" | "in-progress" };
type TaskItem = { id: string; title: string; owner: string; time: string; tag: string };
type UpdateItem = { id: string; title: string; detail: string; tag: string; tone?: "info" | "warning" };

// ============================================================
// STATIC DATA (User Dashboard)
// ============================================================
const defaultCategories: CategoryItem[] = [
  { id: "raw-materials", title: "Raw Materials", count: 0, image: null, bgColor: "#E8F5E9" },
  { id: "packaging", title: "Packaging & Supplies", count: 0, image: null, bgColor: "#FFF3E0" },
  { id: "machinery", title: "Machinery Parts", count: 0, image: null, bgColor: "#FFEBEE" },
  { id: "safety", title: "Safety Equipment", count: 0, image: null, bgColor: "#E3F2FD" },
  { id: "chemicals", title: "Chemicals & Solvents", count: 0, image: null, bgColor: "#F3E5F5" },
  { id: "tools", title: "Tools & Hardware", count: 0, image: null, bgColor: "#FFF8E1" },
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

// ============================================================
// MAIN DASHBOARD SCREEN
// ============================================================
export const DashboardScreen = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === AppRole.ADMIN;

  return isAdmin ? <AdminDashboardContent /> : <UserDashboardContent />;
};

// ============================================================
// ADMIN DASHBOARD CONTENT
// ============================================================
const AdminDashboardContent = () => {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch admin stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const navigateToTab = (route: string) => {
    navigation.navigate("Main", { screen: route as any });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
      </View>
    );
  }

  const firstName = user?.displayName?.split(" ")[0] || "Admin";

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Greeting */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{firstName}</Text>
        </View>

        {/* Error State */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + "20", padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={fetchStats}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Stats Grid */}
        <View style={[styles.statsGrid, { gap: spacing.md, marginBottom: spacing.xl }]}>
          <AdminStatCard
            title="Total Users"
            value={stats?.users.total.toString() ?? "--"}
            subtitle={`${stats?.users.active ?? 0} active`}
            accentColor={colors.primary}
            onPress={() => navigateToTab(routes.USERS)}
          />
          <AdminStatCard
            title={stats?.verifications.pending === 0 ? "Verifications" : "Pending Reviews"}
            value={stats?.verifications.pending === 0 ? "✓" : (stats?.verifications.pending.toString() ?? "--")}
            subtitle={stats?.verifications.pending === 0 ? "All approved" : "Awaiting review"}
            accentColor={stats?.verifications.pending === 0 ? colors.success : colors.warning}
            highlighted={stats?.verifications.pending !== undefined && stats.verifications.pending > 0}
            onPress={() => navigateToTab(routes.VERIFICATIONS)}
          />
          <AdminStatCard
            title="Active Companies"
            value={stats?.companies.active.toString() ?? "--"}
            subtitle={`${stats?.companies.total ?? 0} total`}
            accentColor={colors.success}
            onPress={() => navigateToTab(routes.COMPANIES)}
          />
          <AdminStatCard
            title="Today's Activity"
            value={stats?.today.newVerifications.toString() ?? "--"}
            subtitle={`${stats?.today.newUsers ?? 0} new users`}
            accentColor="#3B82F6"
          />
        </View>

        {/* Verification Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
          Verification Summary
        </Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.md, borderRadius: 12, marginBottom: spacing.xl }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{stats?.verifications.pending ?? 0}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{stats?.verifications.approved ?? 0}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Approved</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.error }]}>{stats?.verifications.rejected ?? 0}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
          Quick Actions
        </Text>
        <View style={{ gap: spacing.sm }}>
          <AdminActionItem label="Review Pending Verifications" badge={stats?.verifications.pending} onPress={() => navigateToTab(routes.VERIFICATIONS)} />
          <AdminActionItem label="Manage Users" badge={stats?.users.total} onPress={() => navigateToTab(routes.USERS)} />
          <AdminActionItem label="View All Companies" badge={stats?.companies.total} onPress={() => navigateToTab(routes.COMPANIES)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// USER DASHBOARD CONTENT
// ============================================================
const UserDashboardContent = () => {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await inventoryService.getCategoryStats();
      const mappedCategories = response.categories.map((cat) => {
        const defaultCat = defaultCategories.find((d) => d.id === cat.id);
        return {
          id: cat.id,
          title: cat.title,
          count: cat.count,
          image: null,
          bgColor: defaultCat?.bgColor || "#E8F5E9",
        };
      });
      setCategories(mappedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

          {/* Inventory Action Buttons */}
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("InventoryList")}
              activeOpacity={0.8}
              style={{
                flex: 1,
                overflow: "hidden",
                borderRadius: 12,
              }}
            >
              <LinearGradient
                colors={["#FF4757", "#FF6348"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 18 }}>🛒</Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                  Browse & Add to Cart
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("AddInventoryItem")}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.surface,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "700" }}>+</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                Add New
              </Text>
            </TouchableOpacity>
          </View>

          <CategoryGrid items={categories} onCategoryPress={(cat) => {
            // TODO: Navigate to category detail screen
            console.log("Category pressed:", cat.id);
          }} />
          <PipelineList items={pipeline} />
          <TaskBoard items={tasks} />
          <UpdatesPanel items={updates} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// ADMIN COMPONENTS
// ============================================================
type AdminStatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
  highlighted?: boolean;
  onPress?: () => void;
};

const AdminStatCard = ({ title, value, subtitle, accentColor, highlighted, onPress }: AdminStatCardProps) => {
  const { colors, spacing } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.adminStatCard,
        {
          backgroundColor: highlighted ? accentColor + "15" : colors.surface,
          borderColor: highlighted ? accentColor : colors.border,
          borderWidth: highlighted ? 2 : 1,
          padding: spacing.md,
          borderRadius: 12,
        },
      ]}
    >
      <Text style={[styles.adminStatValue, { color: accentColor || colors.primary }]}>{value}</Text>
      <Text style={[styles.adminStatTitle, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.adminStatSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

type AdminActionItemProps = {
  label: string;
  badge?: number;
  onPress?: () => void;
};

const AdminActionItem = ({ label, badge, onPress }: AdminActionItemProps) => {
  const { colors, spacing } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.md, borderRadius: 8 }]}
    >
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.actionRight}>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.actionBadge, { backgroundColor: colors.primary + "20", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12, marginRight: spacing.sm }]}>
            <Text style={[styles.actionBadgeText, { color: colors.primary }]}>{badge}</Text>
          </View>
        )}
        <Text style={[styles.actionArrow, { color: colors.textMuted }]}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// USER DASHBOARD COMPONENTS
// ============================================================
const HeroCard = () => {
  const { spacing, radius } = useTheme();

  return (
    <LinearGradient
      colors={["#00B2FF", "#FF6B6B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroCard, { borderRadius: radius.lg, padding: spacing.lg }]}
    >
      <View style={styles.heroHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: "#FFFFFF" }]}>Production pulse</Text>
          <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.85)" }]}>
            Keep dispatches on time and floor running smooth.
          </Text>
        </View>
        <View style={[styles.heroBadge, { borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)" }]}>
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

type CategoryGridProps = {
  items: CategoryItem[];
  onCategoryPress?: (category: CategoryItem) => void;
};

const CategoryGrid = ({ items, onCategoryPress }: CategoryGridProps) => {
  const { colors, spacing } = useTheme();

  const rows = items.reduce<CategoryItem[][]>((acc, item, index) => {
    if (index % 3 === 0) acc.push([item]);
    else acc[acc.length - 1].push(item);
    return acc;
  }, []);

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

  const getBgColor = (id: string): string => {
    const bgColors: Record<string, string> = {
      "raw-materials": "#D1FAE5",
      "packaging": "#FED7AA",
      "machinery": "#FECACA",
      "safety": "#BFDBFE",
      "chemicals": "#DDD6FE",
      "tools": "#FEF3C7",
    };
    return bgColors[id] || "#E8F5E9";
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {rows.map((row, rowIndex) => (
        <View key={`cat-row-${rowIndex}`} style={styles.categoryRow}>
          {row.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => onCategoryPress?.(item)}
            >
              <View style={styles.categoryCircleOuter}>
                <View style={[styles.categoryCircleSolid, { backgroundColor: getBgColor(item.id) }]}>
                  <Text style={styles.categoryIcon}>{getIcon(item.id)}</Text>
                </View>
                {item.count > 0 && (
                  <View style={styles.countBadgeSolid}>
                    <Text style={styles.countBadgeTextSolid}>{item.count}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.categoryTitleCircle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
          {row.length < 3 &&
            Array(3 - row.length).fill(null).map((_, i) => <View key={`empty-${i}`} style={styles.categoryItem} />)}
        </View>
      ))}
    </View>
  );
};

const PipelineList = ({ items }: { items: PipelineItem[] }) => {
  const { colors, spacing, radius } = useTheme();

  const getStatusInfo = (status: PipelineItem["status"]) => {
    switch (status) {
      case "accepted": return { label: "Accepted", color: "#6BCF7F" };
      case "pending": return { label: "Pending", color: "#F5D47E" };
      case "cancelled": return { label: "Cancelled", color: "#EF6B6B" };
      case "in-progress": return { label: "In Progress", color: "#7AC8F5" };
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
              style={[styles.pipelineCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}
            >
              <View style={styles.pipelineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pipelineTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.pipelineMeta, { color: colors.textMuted }]}>Owner: {item.owner}</Text>
                </View>
                <Badge label={statusInfo.label} color={statusInfo.color} />
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
          <View key={item.id} style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
            <View style={styles.taskHeader}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>{item.title}</Text>
              <Badge label={item.tag} color="#7AC8F5" />
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
          <View key={item.id} style={[styles.updateCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
            <View style={styles.updateHeader}>
              <Badge label={item.tag} color={item.tone === "warning" ? "#F5D47E" : "#7AC8F5"} />
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
      {actionLabel && (
        <TouchableOpacity style={[styles.sectionAction, { borderRadius: radius.pill, borderColor: colors.primary }]}>
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Badge = ({ label, color }: { label: string; color: string }) => {
  const { spacing, radius } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: color + "20", borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // Common
  greeting: { fontSize: 16, fontWeight: "600" },
  userName: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 14, flex: 1 },
  retryText: { fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionAction: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  sectionActionText: { fontSize: 12, fontWeight: "700" },
  badge: { alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "700" },

  // Admin Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap" },
  adminStatCard: { width: "48%" },
  adminStatValue: { fontSize: 32, fontWeight: "800" },
  adminStatTitle: { fontSize: 14, marginTop: 4 },
  adminStatSubtitle: { fontSize: 12, marginTop: 2 },
  summaryCard: { borderWidth: 1 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 28, fontWeight: "700" },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  actionItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1 },
  actionLabel: { fontSize: 16, fontWeight: "500" },
  actionRight: { flexDirection: "row", alignItems: "center" },
  actionBadge: {},
  actionBadgeText: { fontSize: 12, fontWeight: "600" },
  actionArrow: { fontSize: 18 },

  // Hero Card
  heroCard: { overflow: "hidden" },
  heroHeader: { flexDirection: "row", alignItems: "center" },
  heroTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  heroSubtitle: { fontSize: 14, fontWeight: "600" },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },
  statPillGlass: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 10 },
  statLabelWhite: { fontSize: 11, fontWeight: "500", color: "rgba(255,255,255,0.8)" },
  statValueWhite: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  statValueSmall: { fontSize: 12, fontWeight: "500" },
  elegantButtonOuter: { padding: 1.5 },
  elegantButtonInner: { paddingVertical: 14, alignItems: "center" },
  elegantButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.15)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  // Category Grid
  categoryRow: { flexDirection: "row", justifyContent: "space-between" },
  categoryItem: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  categoryCircleOuter: { position: "relative", marginBottom: 10 },
  categoryCircleSolid: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  categoryIcon: { fontSize: 32 },
  countBadgeSolid: { position: "absolute", top: -4, right: -4, backgroundColor: "#6366F1", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, zIndex: 1 },
  countBadgeTextSolid: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  categoryTitleCircle: { fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 16, maxWidth: 90 },

  // Pipeline
  pipelineCard: { borderWidth: 1 },
  pipelineRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  pipelineTitle: { fontSize: 16, fontWeight: "700" },
  pipelineMeta: { fontSize: 12, fontWeight: "600" },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },

  // Tasks
  taskCard: { borderWidth: 1 },
  taskHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  taskTitle: { fontSize: 15, fontWeight: "700", flex: 1, paddingRight: 12 },
  taskFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  taskMeta: { fontSize: 13, fontWeight: "600" },
  taskTime: { fontSize: 13, fontWeight: "700" },

  // Updates
  updateCard: { borderWidth: 1 },
  updateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  updateTitle: { fontSize: 15, fontWeight: "700", flex: 1, textAlign: "right" },
  updateDetail: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
