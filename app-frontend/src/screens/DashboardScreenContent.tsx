import { useState, useEffect, useCallback, useRef } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { adminService, AdminStats } from "../services/admin.service";
import { productService, Product, ProductCategory } from "../services/product.service";
import { preferenceService } from "../services/preference.service";
import { adService, AdFeedCard } from "../services/ad.service";
import { RootStackParamList } from "../navigation/types";
import { routes } from "../navigation/routes";
import { AppRole, isAdminRole } from "../constants/roles";
import { APP_NAME } from "../constants/brand";
import { AdminDashboardExtras } from "./admin/components/AdminDashboardExtras";
import { scale, moderateScale } from "../utils/responsive";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { AdaptiveSingleLineText } from "../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../components/text/AdaptiveTwoLineText";
import { motion } from "../theme/motion";
import { useToast } from "../components/ui/Toast";
import { callProductSeller, startProductConversation } from "./product/utils/productContact";
import { HeroBannerCarousel } from "../components/home/HeroBannerCarousel";

// ============================================================
// TYPES
// ============================================================
type CategoryItem = {
  id: string;
  title: string;
  displayTitle: string;
  count: number;
  icon: string;
  bgColor: string;
  totalQuantity?: number;
};

// ============================================================
// STATIC DATA
// ============================================================
const CATEGORY_CATALOG: Array<{ id: string; title: string }> = [
  { id: "food-beverage-manufacturing", title: "Food & Beverage Manufacturing" },
  { id: "textile-apparel-manufacturing", title: "Textile & Apparel Manufacturing" },
  { id: "paper-packaging-industry", title: "Paper & Packaging Industry" },
  { id: "chemical-manufacturing", title: "Chemical Manufacturing" },
  { id: "pharmaceutical-medical", title: "Pharmaceutical & Medical Manufacturing" },
  { id: "plastic-polymer-industry", title: "Plastic & Polymer Industry" },
  { id: "rubber-industry", title: "Rubber Industry" },
  { id: "metal-steel-industry", title: "Metal & Steel Industry" },
  { id: "automobile-auto-components", title: "Automobile & Auto Components" },
  { id: "electrical-electronics-manufacturing", title: "Electrical & Electronics Manufacturing" },
  { id: "machinery-heavy-engineering", title: "Machinery & Heavy Engineering" },
  { id: "wood-furniture-industry", title: "Wood & Furniture Industry" },
  { id: "construction-material-industry", title: "Construction Material Industry" },
  { id: "leather-industry", title: "Leather Industry" },
  { id: "petroleum-energy-manufacturing", title: "Petroleum & Energy-Based Manufacturing" },
  { id: "defence-aerospace-manufacturing", title: "Defence & Aerospace Manufacturing" },
  { id: "consumer-goods-fmcg", title: "Consumer Goods (FMCG) Manufacturing" },
  { id: "printing-publishing", title: "Printing & Publishing" },
  { id: "toys-sports-goods", title: "Toys & Sports Goods Manufacturing" },
  { id: "handicrafts-cottage-industries", title: "Handicrafts & Cottage Industries" },
  // Legacy buckets retained for compatibility
  { id: "finished-goods", title: "Finished Goods" },
  { id: "components", title: "Components & Parts" },
  { id: "raw-materials", title: "Raw Materials" },
  { id: "machinery", title: "Machinery & Equipment" },
  { id: "packaging", title: "Packaging" },
  { id: "services", title: "Services" },
  { id: "other", title: "Other" },
];

const fallbackCategories: ProductCategory[] = CATEGORY_CATALOG.map((item) => ({
  ...item,
  count: 0,
  totalQuantity: 0,
}));

const CATEGORY_TITLE_BY_ID = new Map(CATEGORY_CATALOG.map((item) => [item.id, item.title]));

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && /^[a-z0-9]+$/i.test(word)) {
        return word.toUpperCase();
      }
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");

const normalizeCategoryTitle = (value?: string) => {
  const cleaned = (value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Other";
  return toTitleCase(cleaned);
};

const toCategoryDisplayTitle = (title: string) => {
  const compact = title
    .replace(/\s+(Manufacturing|Industry|Industries)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return compact || title;
};

const CATEGORY_META: Record<string, { icon: string; bgColor: string }> = {
  "food-beverage-manufacturing": { icon: "🍚", bgColor: "#FEF3C7" },
  "textile-apparel-manufacturing": { icon: "👕", bgColor: "#F3E8FF" },
  "paper-packaging-industry": { icon: "📦", bgColor: "#E0F2FE" },
  "chemical-manufacturing": { icon: "⚗️", bgColor: "#FFE4E6" },
  "pharmaceutical-medical": { icon: "💊", bgColor: "#E0E7FF" },
  "plastic-polymer-industry": { icon: "🧴", bgColor: "#DCFCE7" },
  "rubber-industry": { icon: "🛞", bgColor: "#FFF7ED" },
  "metal-steel-industry": { icon: "🏗️", bgColor: "#E5E7EB" },
  "automobile-auto-components": { icon: "🚗", bgColor: "#FEE2E2" },
  "electrical-electronics-manufacturing": { icon: "🔌", bgColor: "#DBEAFE" },
  "machinery-heavy-engineering": { icon: "⚙️", bgColor: "#EDE9FE" },
  "wood-furniture-industry": { icon: "🪑", bgColor: "#FEF9C3" },
  "construction-material-industry": { icon: "🧱", bgColor: "#FFEDD5" },
  "leather-industry": { icon: "👞", bgColor: "#FDE68A" },
  "petroleum-energy-manufacturing": { icon: "⛽", bgColor: "#FFF1F2" },
  "defence-aerospace-manufacturing": { icon: "✈️", bgColor: "#E0F2FE" },
  "consumer-goods-fmcg": { icon: "🧼", bgColor: "#ECFDF3" },
  "printing-publishing": { icon: "📰", bgColor: "#E5E7EB" },
  "toys-sports-goods": { icon: "🎾", bgColor: "#F3E8FF" },
  "handicrafts-cottage-industries": { icon: "🧶", bgColor: "#FFF7ED" },
  "finished-goods": { icon: "📦", bgColor: "#E0EAFF" },
  components: { icon: "🧩", bgColor: "#E9D5FF" },
  "raw-materials": { icon: "🧱", bgColor: "#DCFCE7" },
  machinery: { icon: "⚙️", bgColor: "#FFE4E6" },
  packaging: { icon: "🎁", bgColor: "#FFF7ED" },
  services: { icon: "🛠️", bgColor: "#E0F2FE" },
  other: { icon: "🗂️", bgColor: "#F3F4F6" },
};

// ============================================================
// MAIN DASHBOARD SCREEN
// ============================================================
export const DashboardScreen = () => {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  return isAdmin ? <AdminDashboardContent /> : <UserDashboardContent />;
};

// ============================================================
// ANIMATED COUNTER COMPONENT
// ============================================================
const AnimatedCounter = ({ value, duration = 1000, style }: { value: number; duration?: number; style?: any }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => animatedValue.removeListener(listener);
  }, [value, duration]);

  return <Text style={style}>{displayValue}</Text>;
};

// ============================================================
// ADMIN DASHBOARD - PREMIUM DESIGN
// ============================================================
const AdminDashboardContent = () => {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { isXCompact, isCompact } = useResponsiveLayout();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (!isRefresh) {
        setLoading((prev) => prev);
      }
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

  // Refetch stats whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  useEffect(() => {
    if (!loading && stats) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, stats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats(true);
  }, [fetchStats]);

  const navigateToTab = (route: string) => {
    navigation.navigate("Main", { screen: route as any });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={styles.loaderContainer}>
          <LinearGradient
            colors={[colors.primary, "#148DB2"]}
            style={styles.loaderGradient}
          >
            <ActivityIndicator size="large" color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  const firstName = user?.displayName?.split(" ")[0] || "Admin";
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 16) return "Good afternoon";
    if (hour >= 16 && hour < 20) return "Good evening";
    return "Good night";
  };

  const pendingCount = stats?.verifications.pending ?? 0;
  const statGap = scale(12);
  const statsCardWidth = Math.max(140, (width - spacing.lg * 2 - statGap) / 2);
  const actionCardWidth = isXCompact ? scale(78) : isCompact ? scale(84) : scale(90);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient Orbs */}
      <View style={styles.bgOrbContainer}>
        <LinearGradient
          colors={["rgba(108, 99, 255, 0.15)", "transparent"]}
          style={[styles.bgOrb, styles.bgOrb1]}
        />
        <LinearGradient
          colors={["rgba(255, 107, 107, 0.1)", "transparent"]}
          style={[styles.bgOrb, styles.bgOrb2]}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }}
        >
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>{getGreeting()},</Text>
              <Text style={[styles.userName, { color: colors.text }]}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: colors.primary + "15" }]}
              onPress={() => navigation.navigate("Profile" as any)}
            >
              <LinearGradient
                colors={[colors.primary, "#148DB2"]}
                style={styles.profileGradient}
              >
                <Text style={styles.profileInitial}>{firstName.charAt(0)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Error State */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + "15", marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.lg }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={() => fetchStats()} style={[styles.retryButton, { backgroundColor: colors.error }]}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main Stats Hero */}
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <LinearGradient
              colors={["#19B8E6", "#148DB2", "#4338CA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderRadius: radius.xl }]}
            >
              {/* Decorative Elements */}
              <View style={styles.heroDecor1} />
              <View style={styles.heroDecor2} />
              <View style={styles.heroDecor3} />

              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Admin Overview</Text>
                <Text style={styles.heroSubtitle}>Your platform at a glance</Text>

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatBox}>
                    <View style={styles.heroStatIconBg}>
                      <Ionicons name="people" size={20} color="#19B8E6" />
                    </View>
                    <AnimatedCounter value={stats?.users.total ?? 0} style={styles.heroStatValue} />
                    <Text style={styles.heroStatLabel}>Users</Text>
                  </View>

                  <View style={styles.heroStatBox}>
                    <View style={styles.heroStatIconBg}>
                      <Ionicons name="business" size={20} color="#10B981" />
                    </View>
                    <AnimatedCounter value={stats?.companies.active ?? 0} style={styles.heroStatValue} />
                    <Text style={styles.heroStatLabel}>Companies</Text>
                  </View>

                  <View style={styles.heroStatBox}>
                    <View style={[styles.heroStatIconBg, pendingCount > 0 && styles.heroStatIconBgWarning]}>
                      <Ionicons name="time" size={20} color={pendingCount > 0 ? "#F59E0B" : "#19B8E6"} />
                    </View>
                    <AnimatedCounter value={pendingCount} style={styles.heroStatValue} />
                    <Text style={styles.heroStatLabel}>Pending</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Pending Alert */}
          {pendingCount > 0 && (
            <TouchableOpacity
              onPress={() => navigateToTab(routes.VERIFICATIONS)}
              activeOpacity={0.9}
              style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}
            >
              <LinearGradient
                colors={["#FEF3C7", "#FDE68A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.alertCard, { borderRadius: radius.lg }]}
              >
                <View style={styles.alertPulse}>
                  <View style={[styles.alertDot, { backgroundColor: "#F59E0B" }]} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {pendingCount} verification{pendingCount > 1 ? "s" : ""} awaiting review
                  </Text>
                  <Text style={styles.alertSubtitle}>Tap to review and take action</Text>
                </View>
                <View style={styles.alertArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#92400E" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Stats Grid */}
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
              <View style={[styles.sectionBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>Live</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon="person-add"
                label="New Today"
                value={stats?.today.newUsers ?? 0}
                trend={stats?.today.newUsers && stats.today.newUsers > 0 ? "up" : undefined}
                gradient={["#3B82F6", "#1D4ED8"]}
                cardWidth={isXCompact ? undefined : statsCardWidth}
                fullWidth={isXCompact}
              />
              <StatCard
                icon="document-text"
                label="New Requests"
                value={stats?.today.newVerifications ?? 0}
                gradient={["#8B5CF6", "#6D28D9"]}
                cardWidth={isXCompact ? undefined : statsCardWidth}
                fullWidth={isXCompact}
              />
              <StatCard
                icon="checkmark-circle"
                label="Approved"
                value={stats?.verifications.approved ?? 0}
                gradient={["#10B981", "#059669"]}
                cardWidth={isXCompact ? undefined : statsCardWidth}
                fullWidth={isXCompact}
              />
              <StatCard
                icon="close-circle"
                label="Rejected"
                value={stats?.verifications.rejected ?? 0}
                gradient={["#F45E6C", "#DC2626"]}
                cardWidth={isXCompact ? undefined : statsCardWidth}
                fullWidth={isXCompact}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md, paddingHorizontal: spacing.lg }]}>
              Quick Actions
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsScrollContent}
            >
              <ActionCard
                icon="clipboard"
                label="Reviews"
                color="#F59E0B"
                badge={pendingCount}
                onPress={() => navigateToTab(routes.VERIFICATIONS)}
                cardWidth={actionCardWidth}
              />
              <ActionCard
                icon="people"
                label="Users"
                color="#3B82F6"
                onPress={() => navigateToTab(routes.USERS)}
                cardWidth={actionCardWidth}
              />
              <ActionCard
                icon="chatbubbles"
                label="Messages"
                color="#19B8E6"
                onPress={() => navigateToTab(routes.CHAT)}
                cardWidth={actionCardWidth}
              />
              <ActionCard
                icon="cube"
                label="Catalog"
                color="#8B5CF6"
                onPress={() => navigation.navigate("AdminCatalog")}
                cardWidth={actionCardWidth}
              />
            </ScrollView>
          </View>

          {/* Recent Activity */}
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
              Management
            </Text>

            <View style={{ gap: spacing.sm }}>
              <ManagementCard
                icon="shield-checkmark"
                title="Review Verifications"
                subtitle="Approve or reject pending company verifications"
                badge={pendingCount}
                badgeColor="#F59E0B"
                onPress={() => navigateToTab(routes.VERIFICATIONS)}
              />
              <ManagementCard
                icon="people-circle"
                title="User Management"
                subtitle="View profiles, preferences, and activity"
                value={`${stats?.users.active ?? 0} active`}
                onPress={() => navigateToTab(routes.USERS)}
              />
              <ManagementCard
                icon="storefront"
                title="Company Directory"
                subtitle="Manage registered companies and documents"
                value={`${stats?.companies.total ?? 0} total`}
                onPress={() => navigateToTab(routes.COMPANIES)}
              />
              <ManagementCard
                icon="cube-outline"
                title="Manage In-house Products"
                subtitle="Publish catalog products shown to all users"
                onPress={() => navigation.navigate("AdminCatalog")}
              />
              <ManagementCard
                icon="megaphone-outline"
                title="Ad Studio"
                subtitle="Launch targeted dashboard advertisements"
                onPress={() => navigation.navigate("AdStudio")}
              />
            </View>
          </View>

          {/* Command Center Extras: Chart, Approvals, Activity Feed */}
          <AdminDashboardExtras />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ============================================================
// ADMIN COMPONENTS
// ============================================================
type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  trend?: "up" | "down";
  gradient: [string, string];
  cardWidth?: number;
  fullWidth?: boolean;
};

const StatCard = ({ icon, label, value, trend, gradient, cardWidth, fullWidth }: StatCardProps) => {
  const { colors, radius, spacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.statCard, fullWidth ? { width: "100%" } : cardWidth ? { width: cardWidth } : null, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.statCardInner, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}
      >
        <LinearGradient colors={gradient} style={styles.statCardIcon}>
          <Ionicons name={icon} size={18} color="#fff" />
        </LinearGradient>
        <View style={styles.statCardContent}>
          <View style={styles.statCardValueRow}>
            <Text style={[styles.statCardValue, { color: colors.text }]}>{value}</Text>
            {trend && (
              <View style={[styles.trendBadge, { backgroundColor: trend === "up" ? "#10B98120" : "#F45E6C20" }]}>
                <Ionicons name={trend === "up" ? "trending-up" : "trending-down"} size={12} color={trend === "up" ? "#10B981" : "#F45E6C"} />
              </View>
            )}
          </View>
          <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

type ActionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  badge?: number;
  onPress: () => void;
  cardWidth?: number;
};

const ActionCard = ({ icon, label, color, badge, onPress, cardWidth }: ActionCardProps) => {
  const { colors, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.actionCard,
          cardWidth ? { width: cardWidth } : null,
          { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border },
        ]}
      >
        {badge !== undefined && badge > 0 && (
          <View style={[styles.actionBadge, { backgroundColor: "#F45E6C" }]}>
            <Text style={styles.actionBadgeText}>{badge}</Text>
          </View>
        )}
        <View style={[styles.actionIconBg, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

type ManagementCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge?: number;
  badgeColor?: string;
  value?: string;
  onPress: () => void;
};

const ManagementCard = ({ icon, title, subtitle, badge, badgeColor, value, onPress }: ManagementCardProps) => {
  const { colors, radius } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.managementCard, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}
    >
      <View style={[styles.managementIcon, { backgroundColor: colors.primary + "10" }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.managementContent}>
        <AdaptiveSingleLineText style={[styles.managementTitle, { color: colors.text }]}>
          {title}
        </AdaptiveSingleLineText>
        <AdaptiveSingleLineText style={[styles.managementSubtitle, { color: colors.textMuted }]}>
          {subtitle}
        </AdaptiveSingleLineText>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.managementBadge, { backgroundColor: badgeColor || colors.primary }]}>
          <Text style={styles.managementBadgeText}>{badge}</Text>
        </View>
      )}
      {value && (
        <AdaptiveSingleLineText style={[styles.managementValue, { color: colors.textSecondary }]}>
          {value}
        </AdaptiveSingleLineText>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

// ============================================================
// USER DASHBOARD CONTENT
// ============================================================
const UserDashboardContent = () => {
  const { spacing, colors, radius } = useTheme();
  const { isXCompact, isCompact } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isGuest = user?.role === AppRole.GUEST;
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const heroFloatAnim = useRef(new Animated.Value(0)).current;
  const heroGlowAnim = useRef(new Animated.Value(0)).current;
  const sectionReveal = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;

  const [categories, setCategories] = useState<CategoryItem[]>(
    fallbackCategories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      displayTitle: toCategoryDisplayTitle(cat.title),
      count: cat.count,
      totalQuantity: cat.totalQuantity,
      icon: CATEGORY_META[cat.id]?.icon || "📦",
      bgColor: CATEGORY_META[cat.id]?.bgColor || "#E5E7EB",
    }))
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [adCards, setAdCards] = useState<AdFeedCard[]>([]);
  const [adFeedLoading, setAdFeedLoading] = useState(false);
  const [heroBannerCards, setHeroBannerCards] = useState<AdFeedCard[]>([]);
  const [heroBannerLoading, setHeroBannerLoading] = useState(true);
  const seenImpressionCampaigns = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotionEnabled(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotionEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled) {
      heroFloatAnim.setValue(0);
      heroGlowAnim.setValue(0.45);
      sectionReveal.forEach((value) => value.setValue(1));
      return;
    }

    heroFloatAnim.setValue(0);
    heroGlowAnim.setValue(0);
    sectionReveal.forEach((value) => value.setValue(0));

    const ambientFloat = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloatAnim, {
          toValue: 1,
          duration: motion.duration.ambient,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloatAnim, {
          toValue: 0,
          duration: motion.duration.ambient,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const ambientGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlowAnim, {
          toValue: 1,
          duration: motion.duration.ambientLong,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroGlowAnim, {
          toValue: 0,
          duration: motion.duration.ambientLong,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    ambientFloat.start();
    ambientGlow.start();

    Animated.stagger(
      motion.delay.short,
      sectionReveal.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: motion.duration.medium,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();

    return () => {
      ambientFloat.stop();
      ambientGlow.stop();
    };
  }, [heroFloatAnim, heroGlowAnim, reduceMotionEnabled, sectionReveal]);

  const revealStyle = (index: number) => ({
    opacity: sectionReveal[index],
    transform: [
      {
        translateY: sectionReveal[index].interpolate({
          inputRange: [0, 1],
          outputRange: [motion.distance.medium, 0],
        }),
      },
    ],
  });

  const heroFloatTranslate = heroFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -motion.distance.tiny],
  });

  const heroGlowScale = heroGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });

  const mapCategories = useCallback(
    (incoming?: ProductCategory[]) => {
      const baseMap = new Map<string, CategoryItem>();
      CATEGORY_CATALOG.forEach((cat) => {
        const meta = CATEGORY_META[cat.id] || { icon: "📦", bgColor: "#E5E7EB" };
        baseMap.set(cat.id, {
          id: cat.id,
          title: cat.title,
          displayTitle: toCategoryDisplayTitle(cat.title),
          count: 0,
          totalQuantity: 0,
          icon: meta.icon,
          bgColor: meta.bgColor,
        });
      });

      (incoming || []).forEach((cat) => {
        const meta = CATEGORY_META[cat.id] || { icon: "📦", bgColor: "#E5E7EB" };
        const resolvedTitle =
          CATEGORY_TITLE_BY_ID.get(cat.id) || normalizeCategoryTitle(cat.title || cat.id);
        baseMap.set(cat.id, {
          id: cat.id,
          title: resolvedTitle,
          displayTitle: toCategoryDisplayTitle(resolvedTitle),
          count: cat.count,
          totalQuantity: cat.totalQuantity,
          icon: meta.icon,
          bgColor: meta.bgColor,
        });
      });

      return Array.from(baseMap.values());
    },
    []
  );

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const response = await productService.getCategoryStats({
        scope: "marketplace",
      });
      setCategories(mapCategories(response.categories));
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      setCategoriesError(err.message || "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, [mapCategories]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const trackAdImpression = useCallback((card?: AdFeedCard | null) => {
    if (!card) return;
    if (seenImpressionCampaigns.current.has(card.campaignId)) return;
    seenImpressionCampaigns.current.add(card.campaignId);
    adService.logEvent({
      campaignId: card.campaignId,
      type: "impression",
      placement: card.placement,
      sessionId: card.sessionId,
      metadata: { origin: "dashboard_home" },
    }).catch(() => {});
  }, []);

  const fetchAdFeed = useCallback(async () => {
    if (isGuest) {
      setAdCards([]);
      return;
    }
    try {
      setAdFeedLoading(true);
      const feed = await adService.getFeed({ placement: "dashboard_home", limit: 5 });
      seenImpressionCampaigns.current.clear();
      setAdCards(feed.cards || []);
      if (feed.cards?.length) {
        trackAdImpression(feed.cards[0]);
      }
    } catch {
      setAdCards([]);
    } finally {
      setAdFeedLoading(false);
    }
  }, [isGuest, trackAdImpression]);

  const fetchHeroBanners = useCallback(async () => {
    if (isGuest) {
      setHeroBannerCards([]);
      setHeroBannerLoading(false);
      return;
    }
    try {
      setHeroBannerLoading(true);
      const feed = await adService.getFeed({ placement: "hero_banner", limit: 5 });
      setHeroBannerCards(feed.cards || []);
      if (feed.cards?.length) {
        trackAdImpression(feed.cards[0]);
      }
    } catch {
      setHeroBannerCards([]);
    } finally {
      setHeroBannerLoading(false);
    }
  }, [isGuest, trackAdImpression]);

  useFocusEffect(
    useCallback(() => {
      fetchAdFeed();
      fetchHeroBanners();
    }, [fetchAdFeed, fetchHeroBanners])
  );

  const handleHeroBannerPress = useCallback(
    (card: AdFeedCard) => {
      adService.logEvent({
        campaignId: card.campaignId,
        type: "click",
        placement: card.placement,
        sessionId: card.sessionId,
        metadata: { action: "banner_tap" },
      }).catch(() => {});
      if (card.deepLink) {
        // Future: handle deep links
      } else {
        navigation.navigate("ProductDetails", { productId: card.product.id });
      }
    },
    [navigation]
  );

  const buildContactProduct = useCallback((card: AdFeedCard): Product => {
    const product = card.product;
    const promotedPrice = card.pricing?.advertised || card.priceOverride || product.price;
    return {
      _id: product.id,
      name: product.name || "Promoted product",
      category: product.category || "other",
      subCategory: product.subCategory,
      createdBy: product.createdBy,
      price: {
        amount: Number(promotedPrice?.amount || 0),
        currency: promotedPrice?.currency || product.price?.currency || "INR",
        unit: promotedPrice?.unit || product.price?.unit,
      },
      minStockQuantity: 0,
      availableQuantity: 1,
      visibility: "public" as const,
      status: "active" as const,
      images: product.images || [],
      contactPreferences: product.contactPreferences,
      company: product.company
        ? {
            _id: product.company.id || "",
            displayName: product.company.displayName,
            complianceStatus: product.company.complianceStatus,
            contact: product.company.contact,
          }
        : undefined,
      createdAt: "",
      updatedAt: "",
    };
  }, []);

  const handleAdView = useCallback(
    (card: AdFeedCard) => {
      adService.logEvent({
        campaignId: card.campaignId,
        type: "click",
        placement: card.placement,
        sessionId: card.sessionId,
        metadata: { action: "view_product" },
      }).catch(() => {});
      navigation.navigate("ProductDetails", { productId: card.product.id });
    },
    [navigation]
  );

  const handleAdDismiss = useCallback((card: AdFeedCard) => {
    setAdCards((prev) => prev.filter((entry) => entry.id !== card.id));
    adService.logEvent({
      campaignId: card.campaignId,
      type: "dismiss",
      placement: card.placement,
      sessionId: card.sessionId,
      metadata: { action: "dismiss" },
    }).catch(() => {});
  }, []);

  const handleAdMessage = useCallback(
    (card: AdFeedCard) => {
      startProductConversation({
        product: buildContactProduct(card),
        isGuest,
        requestLogin,
        navigation,
        toastError,
      });
      adService.logEvent({
        campaignId: card.campaignId,
        type: "click",
        placement: card.placement,
        sessionId: card.sessionId,
        metadata: { action: "message" },
      }).catch(() => {});
    },
    [buildContactProduct, isGuest, navigation, requestLogin, toastError]
  );

  const handleAdCall = useCallback(
    (card: AdFeedCard) => {
      callProductSeller({
        product: buildContactProduct(card),
        toastError,
      });
      adService.logEvent({
        campaignId: card.campaignId,
        type: "click",
        placement: card.placement,
        sessionId: card.sessionId,
        metadata: { action: "call" },
      }).catch(() => {});
    },
    [buildContactProduct, toastError]
  );

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
      <StatusBar style="light" />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
          locations={[0, 0.56, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.userAmbientOrb,
            {
              backgroundColor: colors.primary + "20",
              transform: [{ scale: heroGlowScale }],
              opacity: reduceMotionEnabled ? 0.34 : 0.5,
            },
          ]}
        />
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner — always visible (full bleed, no padding) */}
        <Animated.View style={revealStyle(0)}>
          <HeroBannerCarousel
            cards={[...heroBannerCards, ...adCards]}
            loading={heroBannerLoading}
            greeting={getGreeting()}
            userName={firstName}
            appName={APP_NAME}
            onCardPress={handleHeroBannerPress}
            onCardVisible={trackAdImpression}
            onSearchPress={() => navigation.navigate("ProductSearch", {})}
            topInset={insets.top + 60}
            onCallPress={handleAdCall}
            onMessagePress={handleAdMessage}
          />
        </Animated.View>

        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <Animated.View style={[revealStyle(1), { gap: spacing.sm }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by category</Text>
            {categoriesError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + "15", padding: spacing.sm, borderRadius: radius.md }]}>
                <Text style={{ color: colors.error, flex: 1 }}>{categoriesError}</Text>
                <TouchableOpacity onPress={fetchCategories}>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {categoriesLoading ? (
              <View style={{ paddingVertical: spacing.lg, alignItems: "center", gap: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textMuted }}>Loading categories...</Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={{ paddingVertical: spacing.md, alignItems: "center", gap: 4 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>No categories yet</Text>
                <Text style={{ color: colors.textMuted }}>Add products to see categories here</Text>
              </View>
            ) : (
              <CategoryGrid
                items={categories}
                columns={isCompact ? 2 : 3}
                onCategoryPress={(cat) => {
                  preferenceService.logEvent({ type: "view_category", category: cat.id }).catch(() => {});
                  navigation.navigate("CategoryProducts", { categoryId: cat.id, title: cat.title });
                }}
              />
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// USER DASHBOARD COMPONENTS
// ============================================================
const formatAdPrice = (price?: { amount?: number; currency?: string }) => {
  const amount = Number(price?.amount || 0);
  const currency = price?.currency || "INR";
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const AdSwipeDeck = ({
  cards,
  loading,
  onCardVisible,
  onView,
  onDismiss,
  onMessage,
  onCall,
}: {
  cards: AdFeedCard[];
  loading?: boolean;
  onCardVisible?: (card: AdFeedCard) => void;
  onView?: (card: AdFeedCard) => void;
  onDismiss?: (card: AdFeedCard) => void;
  onMessage?: (card: AdFeedCard) => void;
  onCall?: (card: AdFeedCard) => void;
}) => {
  const { colors, radius, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(260, width - spacing.lg * 2);
  const [activeIndex, setActiveIndex] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setActiveIndex(0);
    if (cards.length) {
      onCardVisible?.(cards[0]);
    }
  }, [cards, onCardVisible]);

  useEffect(() => {
    shimmerAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={[styles.noAdPillPremium, { backgroundColor: colors.badgeWarning }]}>
          <Text style={[styles.noAdPillTextPremium, { color: colors.warningStrong }]}>Sponsored spotlight</Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700" }}>
          {loading ? "Loading..." : `${activeIndex + 1}/${cards.length}`}
        </Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const page = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
          const index = Math.max(0, Math.min(cards.length - 1, page));
          setActiveIndex(index);
          onCardVisible?.(cards[index]);
        }}
      >
        {cards.map((card) => {
          const imageUrl = card.product.images?.[0]?.url;
          const canMessage = Boolean(card.product.createdBy && card.product.contactPreferences?.allowChat !== false);
          const canCall = Boolean(card.product.company?.contact?.phone && card.product.contactPreferences?.allowCall !== false);
          const listedPrice = card.pricing?.listed || card.product.price;
          const advertisedPrice = card.pricing?.advertised || card.priceOverride || card.product.price;
          const hasDiscount =
            card.pricing?.isDiscounted ||
            (Number(advertisedPrice?.amount || 0) > 0 &&
              Number(listedPrice?.amount || 0) > 0 &&
              Number(advertisedPrice?.amount || 0) < Number(listedPrice?.amount || 0));

          return (
            <LinearGradient
              key={card.id}
              colors={[colors.surface, colors.surfaceElevated, colors.surface]}
              locations={[0, 0.58, 1]}
              style={[
                styles.adCard,
                {
                  width: cardWidth,
                  borderRadius: radius.lg,
                  borderColor: colors.border,
                },
              ]}
            >
              <LinearGradient
                colors={[`${colors.primary}22`, "transparent"]}
                style={styles.adHeroAuraTop}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <LinearGradient
                colors={[`${colors.accent}20`, "transparent"]}
                style={styles.adHeroAuraBottom}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              {imageUrl ? (
                <View style={[styles.adImageWrap, { borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}>
                  <Animated.Image source={{ uri: imageUrl }} style={styles.adImage} resizeMode="cover" />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.adImageShimmer,
                      {
                        transform: [
                          {
                            translateX: shimmerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-90, 220],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
              ) : (
                <View style={[styles.adImagePlaceholder, { borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                </View>
              )}

              <View style={{ gap: 4 }}>
                {card.badge ? (
                  <View style={[styles.adBadge, { borderRadius: radius.pill, backgroundColor: colors.badgeWarning }]}>
                    <Text style={[styles.adBadgeText, { color: colors.warningStrong }]}>{card.badge}</Text>
                  </View>
                ) : null}
                <Text style={[styles.adTitle, { color: colors.text }]} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={[styles.adSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                  {card.subtitle || "Recommended for you"}
                </Text>
                {(advertisedPrice?.amount || listedPrice?.amount) ? (
                  <View style={styles.adPriceRow}>
                    {hasDiscount && listedPrice?.amount ? (
                      <Text style={[styles.adListedPrice, { color: colors.textMuted }]}>
                        {formatAdPrice(listedPrice)}
                      </Text>
                    ) : null}
                    {advertisedPrice?.amount ? (
                      <Text style={[styles.adDiscountPrice, { color: colors.primary }]}>
                        {formatAdPrice(advertisedPrice)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.adActionRow}>
                <TouchableOpacity
                  onPress={() => onDismiss?.(card)}
                  style={[styles.adGhostBtn, { borderColor: colors.border, borderRadius: radius.md }]}
                >
                  <Text style={[styles.adGhostBtnText, { color: colors.textMuted }]}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onView?.(card)}
                  style={[styles.adPrimaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.adPrimaryBtnText, { color: colors.textOnPrimary }]}>{card.ctaLabel || "View Product"}</Text>
                </TouchableOpacity>
              </View>

              {(canMessage || canCall) ? (
                <View style={styles.adContactRow}>
                  {canMessage ? (
                    <TouchableOpacity
                      onPress={() => onMessage?.(card)}
                      style={[styles.adGhostBtn, { borderColor: colors.border, borderRadius: radius.md }]}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
                      <Text style={[styles.adGhostBtnText, { color: colors.primary }]}>Message</Text>
                    </TouchableOpacity>
                  ) : null}
                  {canCall ? (
                    <TouchableOpacity
                      onPress={() => onCall?.(card)}
                      style={[styles.adGhostBtn, { borderColor: colors.border, borderRadius: radius.md }]}
                    >
                      <Ionicons name="call-outline" size={14} color={colors.primary} />
                      <Text style={[styles.adGhostBtnText, { color: colors.primary }]}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </LinearGradient>
          );
        })}
      </ScrollView>

      <View style={styles.adDotsRow}>
        {cards.map((card, index) => (
          <View
            key={`dot-${card.id}`}
            style={[
              styles.adDot,
              {
                backgroundColor: index === activeIndex ? colors.primary : `${colors.textMuted}44`,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const CategoryGrid = ({
  items,
  columns = 3,
  onCategoryPress,
}: {
  items: CategoryItem[];
  columns?: number;
  onCategoryPress?: (category: CategoryItem) => void;
}) => {
  const { colors, spacing } = useTheme();
  const { isXCompact, isCompact } = useResponsiveLayout();
  const effectiveColumns = isCompact ? Math.min(columns, 2) : columns;
  const circleSize = isXCompact ? scale(62) : isCompact ? scale(68) : scale(80);
  const iconFontSize = isXCompact ? moderateScale(24) : isCompact ? moderateScale(28) : moderateScale(32);
  const titleFontSize = isXCompact ? moderateScale(10) : isCompact ? moderateScale(10.5) : moderateScale(12);
  const titleLineHeight = isXCompact ? moderateScale(13) : isCompact ? moderateScale(14) : moderateScale(16);
  const titleMinimumScale = isCompact ? 0.52 : 0.62;

  const rows = items.reduce<CategoryItem[][]>((acc, item, index) => {
    if (index % effectiveColumns === 0) acc.push([item]);
    else acc[acc.length - 1].push(item);
    return acc;
  }, []);

  return (
    <View style={{ gap: spacing.lg }}>
      {rows.map((row, rowIndex) => (
        <View key={`cat-row-${rowIndex}`} style={styles.categoryRow}>
          {row.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.categoryItem,
                styles.categoryItemSafe,
                {
                  flexBasis: `${100 / effectiveColumns}%`,
                  maxWidth: `${100 / effectiveColumns}%`,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => onCategoryPress?.(item)}
            >
              <View style={[styles.categoryCircleOuter, { marginBottom: isXCompact ? scale(6) : scale(10) }]}>
                <View
                  style={[
                    styles.categoryCircleSolid,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      backgroundColor: item.bgColor,
                    },
                  ]}
                >
                  <Text style={[styles.categoryIcon, { fontSize: iconFontSize }]}>{item.icon}</Text>
                </View>
                {item.count > 0 && (
                  <View style={styles.countBadgeSolid}>
                    <Text style={styles.countBadgeTextSolid}>{item.count}</Text>
                  </View>
                )}
              </View>
              <AdaptiveTwoLineText
                containerStyle={styles.categoryTitleWrap}
                minimumFontScale={titleMinimumScale}
                style={[
                  styles.categoryTitleCircle,
                  { color: colors.text, fontSize: titleFontSize, lineHeight: titleLineHeight },
                ]}
              >
                {item.displayTitle || item.title}
              </AdaptiveTwoLineText>
            </TouchableOpacity>
          ))}
          {row.length < effectiveColumns &&
            Array(effectiveColumns - row.length)
              .fill(null)
              .map((_, i) => (
                <View
                  key={`empty-${i}`}
                  style={[
                    styles.categoryItem,
                    styles.categoryItemSafe,
                    {
                      flexBasis: `${100 / effectiveColumns}%`,
                      maxWidth: `${100 / effectiveColumns}%`,
                    },
                  ]}
                />
              ))}
        </View>
      ))}
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Background
  bgOrbContainer: { position: "absolute", width: "100%", height: "100%", overflow: "hidden" },
  bgOrb: { position: "absolute", borderRadius: 999 },
  bgOrb1: { width: 300, height: 300, top: -100, right: -100 },
  bgOrb2: { width: 250, height: 250, bottom: 100, left: -80 },

  // Loader
  loaderContainer: { alignItems: "center", gap: scale(16) },
  loaderGradient: { width: scale(80), height: scale(80), borderRadius: scale(40), alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: moderateScale(16), fontWeight: "500" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: moderateScale(16), fontWeight: "600" },
  userName: { fontSize: moderateScale(32), fontWeight: "800", letterSpacing: -0.5 },
  userAmbientOrb: {
    position: "absolute",
    width: scale(260),
    height: scale(260),
    borderRadius: scale(130),
    top: scale(-90),
    right: scale(-70),
  },
  userHeroCard: {
    borderWidth: 1,
    padding: scale(20),
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  userHeroDecorTop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: scale(180),
    height: scale(160),
    borderBottomLeftRadius: scale(120),
  },
  userHeroDecorBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: scale(160),
    height: scale(120),
    borderTopRightRadius: scale(100),
  },
  userHeroContentWrap: {
    gap: scale(8),
  },
  userHeroGreeting: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  userHeroTitle: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  userHeroSubtitle: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontWeight: "500",
    maxWidth: "92%",
  },
  userHeroTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: scale(6),
  },
  userHeroTag: {
    borderWidth: 1,
    paddingHorizontal: scale(11),
    paddingVertical: scale(6),
  },
  userHeroTagText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  userActionStack: {
    gap: scale(12),
  },
  profileButton: { width: scale(50), height: scale(50), borderRadius: scale(25), padding: scale(3) },
  profileGradient: { flex: 1, borderRadius: scale(22), alignItems: "center", justifyContent: "center" },
  profileInitial: { color: "#fff", fontSize: moderateScale(20), fontWeight: "700" },

  // Error
  errorBanner: { flexDirection: "row", alignItems: "center", gap: scale(10) },
  errorText: { flex: 1, fontSize: moderateScale(14) },
  retryButton: { paddingHorizontal: scale(12), paddingVertical: scale(6), borderRadius: scale(6) },
  retryText: { color: "#fff", fontSize: moderateScale(12), fontWeight: "600" },

  // Hero Card
  heroCard: { padding: scale(24), overflow: "hidden" },
  heroDecor1: { position: "absolute", width: scale(200), height: scale(200), borderRadius: scale(100), backgroundColor: "rgba(255,255,255,0.1)", top: scale(-80), right: scale(-50) },
  heroDecor2: { position: "absolute", width: scale(120), height: scale(120), borderRadius: scale(60), backgroundColor: "rgba(255,255,255,0.08)", bottom: scale(-40), left: scale(20) },
  heroDecor3: { position: "absolute", width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: "rgba(255,255,255,0.05)", top: scale(60), left: scale(-20) },
  heroContent: { position: "relative", zIndex: 1 },
  heroTitle: { color: "#fff", fontSize: moderateScale(22), fontWeight: "800", letterSpacing: -0.3 },
  heroSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: moderateScale(14), marginTop: scale(4) },
  heroStatsRow: { flexDirection: "row", marginTop: scale(24), gap: scale(12) },
  heroStatBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: scale(16), padding: scale(16), alignItems: "center" },
  heroStatIconBg: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: scale(8) },
  heroStatIconBgWarning: { backgroundColor: "#FEF3C7" },
  heroStatValue: { color: "#fff", fontSize: moderateScale(28), fontWeight: "800" },
  heroStatLabel: { color: "rgba(255,255,255,0.8)", fontSize: moderateScale(12), fontWeight: "600", marginTop: scale(4) },

  // Alert Card
  alertCard: { flexDirection: "row", alignItems: "center", padding: scale(16), gap: scale(12) },
  alertPulse: { width: scale(12), height: scale(12), borderRadius: scale(6), backgroundColor: "rgba(245, 158, 11, 0.3)", alignItems: "center", justifyContent: "center" },
  alertDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
  alertContent: { flex: 1 },
  alertTitle: { color: "#92400E", fontSize: moderateScale(15), fontWeight: "700" },
  alertSubtitle: { color: "#A16207", fontSize: moderateScale(13), marginTop: scale(2) },
  alertArrow: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: "rgba(146, 64, 14, 0.1)", alignItems: "center", justifyContent: "center" },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(16) },
  sectionTitle: { fontSize: moderateScale(18), fontWeight: "700" },
  sectionBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(12), gap: scale(4) },
  sectionBadgeText: { fontSize: moderateScale(12), fontWeight: "700" },

  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(12) },
  statCard: { width: "48%" },
  statCardInner: { padding: scale(16), borderWidth: 1, flexDirection: "row", alignItems: "center", gap: scale(12) },
  statCardIcon: { width: scale(40), height: scale(40), borderRadius: scale(12), alignItems: "center", justifyContent: "center" },
  statCardContent: { flex: 1 },
  statCardValueRow: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  statCardValue: { fontSize: moderateScale(24), fontWeight: "800" },
  statCardLabel: { fontSize: moderateScale(12), marginTop: scale(2) },
  trendBadge: { paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(8) },

  // Actions Grid
  actionsScrollContent: { paddingHorizontal: scale(20), gap: scale(12) },
  actionCard: { width: scale(85), padding: scale(14), borderWidth: 1, alignItems: "center", gap: scale(8) },
  actionIconBg: { width: scale(48), height: scale(48), borderRadius: scale(24), alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: moderateScale(13), fontWeight: "600" },
  actionBadge: { position: "absolute", top: scale(8), right: scale(8), minWidth: scale(20), height: scale(20), borderRadius: scale(10), alignItems: "center", justifyContent: "center" },
  actionBadgeText: { color: "#fff", fontSize: moderateScale(11), fontWeight: "700" },

  // Management Card
  managementCard: { flexDirection: "row", alignItems: "center", padding: scale(16), borderWidth: 1, gap: scale(14) },
  managementIcon: { width: scale(48), height: scale(48), borderRadius: scale(24), alignItems: "center", justifyContent: "center" },
  managementContent: { flex: 1, minWidth: 0 },
  managementTitle: { fontSize: moderateScale(16), fontWeight: "600" },
  managementSubtitle: { fontSize: moderateScale(13), marginTop: scale(2) },
  managementBadge: { minWidth: scale(24), height: scale(24), borderRadius: scale(12), alignItems: "center", justifyContent: "center", paddingHorizontal: scale(8) },
  managementBadgeText: { color: "#fff", fontSize: moderateScale(12), fontWeight: "700" },
  managementValue: { fontSize: moderateScale(13), fontWeight: "500" },

  // Add Product Button
  addProductButton: { flexDirection: "row", alignItems: "center", padding: scale(16), borderWidth: 1, gap: scale(14) },
  addProductIcon: { width: scale(48), height: scale(48), borderRadius: scale(24), alignItems: "center", justifyContent: "center" },
  addProductText: { flex: 1, fontSize: moderateScale(16), fontWeight: "600" },

  // Ad Swipe Deck
  adCard: {
    borderWidth: 1,
    padding: scale(12),
    marginRight: scale(10),
    gap: scale(10),
    overflow: "hidden",
    minHeight: scale(306),
  },
  adHeroAuraTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: scale(124),
  },
  adHeroAuraBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(120),
  },
  adImageWrap: {
    width: "100%",
    height: scale(150),
    overflow: "hidden",
    position: "relative",
  },
  adImage: {
    width: "100%",
    height: "100%",
  },
  adImageShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: scale(90),
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  adImagePlaceholder: {
    width: "100%",
    height: scale(120),
    alignItems: "center",
    justifyContent: "center",
  },
  adBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  adBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  adTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    lineHeight: moderateScale(22),
  },
  adSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    lineHeight: moderateScale(17),
  },
  adPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(2),
  },
  adListedPrice: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  adDiscountPrice: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  adActionRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  adPrimaryBtn: {
    flex: 1,
    minHeight: scale(40),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
  },
  adPrimaryBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "900",
  },
  adGhostBtn: {
    minHeight: scale(40),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
  },
  adGhostBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  adContactRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  adDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
  },
  adDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },

  // Sponsored feed label
  noAdPillPremium: { alignSelf: "flex-start", paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: "rgba(0,0,0,0.15)", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  noAdPillTextPremium: { fontSize: moderateScale(12), fontWeight: "700", letterSpacing: 0.3, color: "#1F2937" },

  // Category Grid
  categoryRow: { flexDirection: "row", justifyContent: "flex-start", flexWrap: "wrap" },
  categoryItem: { alignItems: "center", paddingHorizontal: scale(4), minWidth: 0, marginBottom: scale(8) },
  categoryItemSafe: { flexShrink: 1 },
  categoryCircleOuter: { position: "relative", marginBottom: scale(10) },
  categoryCircleSolid: { width: scale(80), height: scale(80), borderRadius: scale(40), alignItems: "center", justifyContent: "center" },
  categoryIcon: { fontSize: moderateScale(32) },
  countBadgeSolid: { position: "absolute", top: scale(-4), right: scale(-4), backgroundColor: "#148DB2", paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(12), zIndex: 1 },
  countBadgeTextSolid: { color: "#FFFFFF", fontSize: moderateScale(10), fontWeight: "700" },
  categoryTitleWrap: { width: "100%", minWidth: 0, alignItems: "center", paddingHorizontal: scale(2) },
  categoryTitleCircle: { fontSize: moderateScale(12), fontWeight: "600", textAlign: "center", lineHeight: moderateScale(16), width: "100%" },
});
