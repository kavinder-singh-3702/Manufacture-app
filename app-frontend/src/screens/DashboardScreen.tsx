import { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { adminService, AdminStats } from "../services/admin.service";
import { verificationService } from "../services/verificationService";
import { productService, ProductCategory } from "../services/product.service";
import { preferenceService, PersonalizedOffer } from "../services/preference.service";
import { RootStackParamList } from "../navigation/types";
import { routes } from "../navigation/routes";
import { AppRole } from "../constants/roles";
import { ComplianceStatus } from "../types/company";
import { scale, moderateScale, wp } from "../utils/responsive";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================
// TYPES
// ============================================================
type CategoryItem = { id: string; title: string; count: number; icon: string; bgColor: string; totalQuantity?: number };
type PromoOffer = {
  id: string;
  title: string;
  description: string;
  oldPrice?: string;
  newPrice: string;
  discountLabel: string;
  tag?: string;
  accent: string;
  gradient: [string, string];
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
  const isAdmin = user?.role === AppRole.ADMIN;

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
      if (!isRefresh && !stats) {
        setLoading(true);
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
  }, [stats]);

  // Refetch stats whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
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
            colors={[colors.primary, "#5248E6"]}
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
                colors={[colors.primary, "#5248E6"]}
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
              <TouchableOpacity onPress={fetchStats} style={[styles.retryButton, { backgroundColor: colors.error }]}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main Stats Hero */}
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <LinearGradient
              colors={["#6C63FF", "#5248E6", "#4338CA"]}
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
                      <Ionicons name="people" size={20} color="#6C63FF" />
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
                      <Ionicons name="time" size={20} color={pendingCount > 0 ? "#F59E0B" : "#6C63FF"} />
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
              />
              <StatCard
                icon="document-text"
                label="New Requests"
                value={stats?.today.newVerifications ?? 0}
                gradient={["#8B5CF6", "#6D28D9"]}
              />
              <StatCard
                icon="checkmark-circle"
                label="Approved"
                value={stats?.verifications.approved ?? 0}
                gradient={["#10B981", "#059669"]}
              />
              <StatCard
                icon="close-circle"
                label="Rejected"
                value={stats?.verifications.rejected ?? 0}
                gradient={["#EF4444", "#DC2626"]}
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
              />
              <ActionCard
                icon="people"
                label="Users"
                color="#3B82F6"
                onPress={() => navigateToTab(routes.USERS)}
              />
              <ActionCard
                icon="chatbubbles"
                label="Messages"
                color="#6C63FF"
                onPress={() => navigateToTab(routes.CHAT)}
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
            </View>
          </View>
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
};

const StatCard = ({ icon, label, value, trend, gradient }: StatCardProps) => {
  const { colors, radius, spacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
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
              <View style={[styles.trendBadge, { backgroundColor: trend === "up" ? "#10B98120" : "#EF444420" }]}>
                <Ionicons name={trend === "up" ? "trending-up" : "trending-down"} size={12} color={trend === "up" ? "#10B981" : "#EF4444"} />
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
};

const ActionCard = ({ icon, label, color, badge, onPress }: ActionCardProps) => {
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
        style={[styles.actionCard, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}
      >
        {badge !== undefined && badge > 0 && (
          <View style={[styles.actionBadge, { backgroundColor: "#EF4444" }]}>
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
  const { colors, radius, spacing } = useTheme();

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
        <Text style={[styles.managementTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.managementSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{subtitle}</Text>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.managementBadge, { backgroundColor: badgeColor || colors.primary }]}>
          <Text style={styles.managementBadgeText}>{badge}</Text>
        </View>
      )}
      {value && (
        <Text style={[styles.managementValue, { color: colors.textSecondary }]}>{value}</Text>
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
  const insets = useSafeAreaInsets();
  const { user, requestSignup } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isGuest = user?.role === AppRole.GUEST;

  const promptSignup = useCallback(() => {
    Alert.alert(
      "Create an account",
      "Create an account to use this feature.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Create account", onPress: requestSignup },
      ]
    );
  }, [requestSignup]);

  const [verificationStatus, setVerificationStatus] = useState<ComplianceStatus | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryItem[]>(
    fallbackCategories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      count: cat.count,
      totalQuantity: cat.totalQuantity,
      icon: CATEGORY_META[cat.id]?.icon || "📦",
      bgColor: CATEGORY_META[cat.id]?.bgColor || "#E5E7EB",
    }))
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [personalizedOffer, setPersonalizedOffer] = useState<PersonalizedOffer | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);

  const mapCategories = useCallback(
    (incoming?: ProductCategory[]) => {
      const baseMap = new Map<string, CategoryItem>();
      CATEGORY_CATALOG.forEach((cat) => {
        const meta = CATEGORY_META[cat.id] || { icon: "📦", bgColor: "#E5E7EB" };
        baseMap.set(cat.id, { id: cat.id, title: cat.title, count: 0, totalQuantity: 0, icon: meta.icon, bgColor: meta.bgColor });
      });

      (incoming || []).forEach((cat) => {
        const meta = CATEGORY_META[cat.id] || { icon: "📦", bgColor: "#E5E7EB" };
        baseMap.set(cat.id, {
          id: cat.id,
          title: cat.title,
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

  const fetchVerificationStatus = useCallback(async () => {
    if (!user?.activeCompany) {
      setVerificationStatus(null);
      setVerificationLoading(false);
      return;
    }
    try {
      const response = await verificationService.getVerificationStatus(user.activeCompany);
      if (response.request && response.request.status === "pending") {
        setVerificationStatus("submitted");
      } else {
        setVerificationStatus(response.company?.complianceStatus || "pending");
      }
      setCompanyName(response.company?.displayName || null);
    } catch (error) {
      console.error("Failed to fetch verification status:", error);
      setVerificationStatus(null);
    } finally {
      setVerificationLoading(false);
    }
  }, [user?.activeCompany]);

  useFocusEffect(
    useCallback(() => {
      fetchVerificationStatus();
    }, [fetchVerificationStatus])
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

  useEffect(() => {
    const fetchOffers = async () => {
      setOffersLoading(true);
      try {
        const { offers } = await preferenceService.getMyOffers();
        setPersonalizedOffer(offers?.[0] ?? null);
      } catch (err: any) {
        console.warn("Failed to fetch personalized offers", err?.message || err);
        setPersonalizedOffer(null);
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 16) return "Good afternoon";
    if (hour >= 16 && hour < 20) return "Good evening";
    return "Good night";
  };

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const getVerificationConfig = () => {
    switch (verificationStatus) {
      case "approved":
        return {
          icon: "checkmark-circle",
          title: "Verified",
          message: companyName ? `${companyName} is verified` : "Your company is verified",
          gradient: ["#10B981", "#059669"] as [string, string],
          showAction: false,
        };
      case "submitted":
        return {
          icon: "time",
          title: "Pending Approval",
          message: "Your verification is under review",
          gradient: ["#F59E0B", "#D97706"] as [string, string],
          showAction: true,
          actionLabel: "View Status",
        };
      case "rejected":
        return {
          icon: "close-circle",
          title: "Verification Rejected",
          message: "Please resubmit your documents",
          gradient: ["#EF4444", "#DC2626"] as [string, string],
          showAction: true,
          actionLabel: "Resubmit",
        };
      case "pending":
      default:
        return {
          icon: "shield",
          title: "Get Verified",
          message: "Unlock premium features and build trust",
          gradient: ["#6C63FF", "#5248E6"] as [string, string],
          showAction: true,
          actionLabel: "Start Verification",
        };
    }
  };

  const handleVerificationPress = () => {
    if (user?.activeCompany) {
      navigation.navigate("CompanyVerification", { companyId: user.activeCompany });
    }
  };

  const verificationConfig = getVerificationConfig();

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

          {personalizedOffer ? (
            <PromoBanner
              offer={{
                id: personalizedOffer.id,
                title: personalizedOffer.title,
                description: personalizedOffer.message || "Special pick for you based on recent activity.",
                oldPrice: personalizedOffer.oldPrice ? `₹${personalizedOffer.oldPrice.toLocaleString()}` : undefined,
                newPrice: `₹${personalizedOffer.newPrice.toLocaleString()}`,
                discountLabel:
                  personalizedOffer.discountPercent !== undefined
                    ? `Save ${personalizedOffer.discountPercent}%`
                    : personalizedOffer.offerType === "combo"
                    ? "Combo offer"
                    : "Special price",
                tag: personalizedOffer.product?.category || personalizedOffer.product?.name || "Personalized",
                accent: "#FACC15",
                gradient: ["#22C55E", "#16A34A"],
              }}
              loading={offersLoading}
              onPress={() =>
                personalizedOffer?.product?.id
                  ? navigation.navigate("CategoryProducts", {
                      categoryId: personalizedOffer.product.category || "",
                      title: personalizedOffer.product.category || "Category",
                  })
                : navigation.navigate("ProductSearch")
            }
          />
          ) : (
            <NoAdHero
              loading={offersLoading}
              onPress={() => navigation.navigate("ProductSearch")}
              onBrowseServices={() => navigation.navigate("Main", { screen: routes.SERVICES })}
            />
          )}

          {user?.activeCompany && !verificationLoading && verificationStatus !== "approved" && (
            <TouchableOpacity onPress={handleVerificationPress} activeOpacity={0.9}>
              <LinearGradient
                colors={verificationConfig.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.verificationCard, { borderRadius: radius.lg }]}
              >
                <View style={styles.verificationIcon}>
                  <Ionicons name={verificationConfig.icon as any} size={28} color="#fff" />
                </View>
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationTitle}>{verificationConfig.title}</Text>
                  <Text style={styles.verificationMessage}>{verificationConfig.message}</Text>
                </View>
                {verificationConfig.showAction && (
                  <View style={styles.verificationArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (isGuest) {
                promptSignup();
                return;
              }
              navigation.navigate("AddProduct");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.surface, colors.surface]}
              style={[styles.addProductButton, { borderRadius: radius.lg, borderColor: colors.border }]}
            >
              <View style={[styles.addProductIcon, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.addProductText, { color: colors.text }]}>Add New Product</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ gap: spacing.sm }}>
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
                onCategoryPress={(cat) => {
                  preferenceService.logEvent({ type: "view_category", category: cat.id }).catch(() => {});
                  navigation.navigate("CategoryProducts", { categoryId: cat.id, title: cat.title });
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// USER DASHBOARD COMPONENTS
// ============================================================
const PromoBanner = ({ offer, onPress, loading }: { offer: PromoOffer; onPress?: () => void; loading?: boolean }) => {
  const { spacing, radius } = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={offer.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.promoCard, { borderRadius: radius.lg, padding: spacing.lg }]}
      >
        <View style={[styles.promoGlow, { backgroundColor: offer.accent }]} />
        <View style={[styles.promoGlowSmall, { backgroundColor: offer.accent }]} />
        <View style={[styles.promoBadgeRow, { marginBottom: spacing.sm }]}>
          <View style={[styles.promoBadge, { borderRadius: radius.pill }]}>
            <Text style={styles.promoBadgeText}>{offer.tag ?? "Special"}</Text>
          </View>
          <View style={[styles.promoDiscount, { backgroundColor: offer.accent, borderRadius: radius.pill }]}>
            <Text style={styles.promoDiscountText}>{offer.discountLabel}</Text>
          </View>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={styles.promoTitle}>{offer.title}</Text>
          <Text style={styles.promoSubtitle}>{offer.description}</Text>
        </View>
        <View style={[styles.promoPriceRow, { marginTop: spacing.sm }]}>
          {offer.oldPrice && <Text style={styles.promoOldPrice}>{offer.oldPrice}</Text>}
          <Text style={styles.promoNewPrice}>{offer.newPrice}</Text>
        </View>
        <View style={[styles.promoCta, { borderRadius: radius.md }]}>
          <Text style={styles.promoCtaText}>{loading ? "Checking offer..." : "Grab this price"}</Text>
          <Text style={styles.promoCtaArrow}>→</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const NoAdHero = ({
  loading,
  onPress,
  onBrowseServices,
}: {
  loading?: boolean;
  onPress?: () => void;
  onBrowseServices?: () => void;
}) => {
  const { radius, spacing, colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primary, colors.accentWarm, colors.backgroundSecondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.noAdCard, { borderRadius: radius.lg, padding: spacing.lg }]}
    >
      {/* Decorative Glow Orbs - matching services stats section */}
      <LinearGradient
        colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.03)"]}
        style={styles.noAdGlowOrb1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.02)"]}
        style={styles.noAdGlowOrb2}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.noAdRing1} />
      <View style={styles.noAdRing2} />
      <View style={styles.noAdSparkle1} />
      <View style={styles.noAdSparkle2} />

      <View style={{ gap: 8, position: "relative", zIndex: 1 }}>
        <View style={styles.noAdPillPremium}>
          <Text style={styles.noAdPillTextPremium}>No admin campaigns right now</Text>
        </View>
        <Text style={styles.noAdTitlePremium}>What do you want to source next?</Text>
        <Text style={styles.noAdSubtitlePremium}>
          Search products or jump into services—we'll route your request instantly.
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: spacing.md, position: "relative", zIndex: 1 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.noAdButtonGradient}
        >
          <Text style={styles.noAdButtonTextPremium}>
            {loading ? "Checking..." : "Search products"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onBrowseServices}
          style={styles.noAdButtonGhostPremium}
        >
          <Text style={styles.noAdButtonGhostTextPremium}>Browse services</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const CategoryGrid = ({ items, onCategoryPress }: { items: CategoryItem[]; onCategoryPress?: (category: CategoryItem) => void }) => {
  const { colors, spacing } = useTheme();

  const rows = items.reduce<CategoryItem[][]>((acc, item, index) => {
    if (index % 3 === 0) acc.push([item]);
    else acc[acc.length - 1].push(item);
    return acc;
  }, []);

  return (
    <View style={{ gap: spacing.lg }}>
      {rows.map((row, rowIndex) => (
        <View key={`cat-row-${rowIndex}`} style={styles.categoryRow}>
          {row.map((item) => (
            <TouchableOpacity key={item.id} style={styles.categoryItem} activeOpacity={0.7} onPress={() => onCategoryPress?.(item)}>
              <View style={styles.categoryCircleOuter}>
                <View style={[styles.categoryCircleSolid, { backgroundColor: item.bgColor }]}>
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                </View>
                {item.count > 0 && (
                  <View style={styles.countBadgeSolid}>
                    <Text style={styles.countBadgeTextSolid}>{item.count}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.categoryTitleCircle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          ))}
          {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => <View key={`empty-${i}`} style={styles.categoryItem} />)}
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
  statCard: { width: (SCREEN_WIDTH - scale(52)) / 2 },
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
  managementContent: { flex: 1 },
  managementTitle: { fontSize: moderateScale(16), fontWeight: "600" },
  managementSubtitle: { fontSize: moderateScale(13), marginTop: scale(2) },
  managementBadge: { minWidth: scale(24), height: scale(24), borderRadius: scale(12), alignItems: "center", justifyContent: "center", paddingHorizontal: scale(8) },
  managementBadgeText: { color: "#fff", fontSize: moderateScale(12), fontWeight: "700" },
  managementValue: { fontSize: moderateScale(13), fontWeight: "500" },

  // Verification Card (User)
  verificationCard: { flexDirection: "row", alignItems: "center", padding: scale(20), gap: scale(16) },
  verificationIcon: { width: scale(56), height: scale(56), borderRadius: scale(28), backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  verificationContent: { flex: 1 },
  verificationTitle: { color: "#fff", fontSize: moderateScale(18), fontWeight: "700" },
  verificationMessage: { color: "rgba(255,255,255,0.85)", fontSize: moderateScale(14), marginTop: scale(4) },
  verificationArrow: { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  // Add Product Button
  addProductButton: { flexDirection: "row", alignItems: "center", padding: scale(16), borderWidth: 1, gap: scale(14) },
  addProductIcon: { width: scale(48), height: scale(48), borderRadius: scale(24), alignItems: "center", justifyContent: "center" },
  addProductText: { flex: 1, fontSize: moderateScale(16), fontWeight: "600" },

  // Promo Banner
  promoCard: { position: "relative", overflow: "hidden" },
  promoGlow: { position: "absolute", width: scale(140), height: scale(140), borderRadius: scale(70), opacity: 0.35, top: scale(-30), right: scale(-30) },
  promoGlowSmall: { position: "absolute", width: scale(90), height: scale(90), borderRadius: scale(45), opacity: 0.25, bottom: scale(-20), left: scale(-20) },
  promoBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promoBadge: { paddingHorizontal: scale(12), paddingVertical: scale(6), backgroundColor: "rgba(255,255,255,0.18)" },
  promoBadgeText: { color: "#FFFFFF", fontSize: moderateScale(12), fontWeight: "700", letterSpacing: 0.5 },
  promoDiscount: { paddingHorizontal: scale(12), paddingVertical: scale(6) },
  promoDiscountText: { color: "#1F2937", fontSize: moderateScale(12), fontWeight: "800" },
  promoTitle: { color: "#FFFFFF", fontSize: moderateScale(20), fontWeight: "800", letterSpacing: -0.4 },
  promoSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: moderateScale(13), fontWeight: "600", lineHeight: moderateScale(18) },
  promoPriceRow: { flexDirection: "row", alignItems: "baseline", gap: scale(12) },
  promoOldPrice: { color: "rgba(255,255,255,0.75)", fontSize: moderateScale(14), fontWeight: "600", textDecorationLine: "line-through" },
  promoNewPrice: { color: "#FFFFFF", fontSize: moderateScale(26), fontWeight: "800", letterSpacing: -0.5 },
  promoCta: { marginTop: scale(14), flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.18)", paddingVertical: scale(10), paddingHorizontal: scale(12) },
  promoCtaText: { color: "#FFFFFF", fontSize: moderateScale(14), fontWeight: "700" },
  promoCtaArrow: { color: "#FFFFFF", fontSize: moderateScale(16), fontWeight: "800" },

  // No Ad Hero - Premium Style (matching Services stats section)
  noAdCard: { position: "relative", overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  noAdGlowOrb1: { position: "absolute", width: scale(200), height: scale(200), borderRadius: scale(100), top: scale(-60), right: scale(-40) },
  noAdGlowOrb2: { position: "absolute", width: scale(160), height: scale(160), borderRadius: scale(80), bottom: scale(-40), left: scale(-40) },
  noAdRing1: { position: "absolute", width: scale(120), height: scale(120), borderRadius: scale(60), borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", top: scale(40), right: scale(60) },
  noAdRing2: { position: "absolute", width: scale(80), height: scale(80), borderRadius: scale(40), borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", bottom: scale(60), left: scale(40) },
  noAdSparkle1: { position: "absolute", width: scale(4), height: scale(4), borderRadius: scale(2), backgroundColor: "rgba(0,0,0,0.3)", top: scale(80), right: scale(100) },
  noAdSparkle2: { position: "absolute", width: scale(3), height: scale(3), borderRadius: scale(1.5), backgroundColor: "rgba(0,0,0,0.2)", top: scale(140), left: scale(80) },
  noAdPillPremium: { alignSelf: "flex-start", paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: "rgba(0,0,0,0.15)", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  noAdPillTextPremium: { fontSize: moderateScale(12), fontWeight: "700", letterSpacing: 0.3, color: "#1F2937" },
  noAdTitlePremium: { fontSize: moderateScale(22), fontWeight: "800", letterSpacing: -0.3, color: "#111827" },
  noAdSubtitlePremium: { fontSize: moderateScale(14), fontWeight: "500", lineHeight: moderateScale(20), color: "rgba(0,0,0,0.7)" },
  noAdButtonGradient: { paddingVertical: scale(14), paddingHorizontal: scale(24), borderRadius: scale(16), alignItems: "center", justifyContent: "center", backgroundColor: "#1F2937" },
  noAdButtonTextPremium: { fontSize: moderateScale(14), fontWeight: "700", color: "#fff" },
  noAdButtonGhostPremium: { flex: 1, paddingVertical: scale(14), borderRadius: scale(16), alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.2)", backgroundColor: "rgba(0,0,0,0.08)" },
  noAdButtonGhostTextPremium: { fontSize: moderateScale(14), fontWeight: "700", color: "#1F2937" },

  // Category Grid
  categoryRow: { flexDirection: "row", justifyContent: "space-between" },
  categoryItem: { flex: 1, alignItems: "center", paddingHorizontal: scale(4) },
  categoryCircleOuter: { position: "relative", marginBottom: scale(10) },
  categoryCircleSolid: { width: scale(80), height: scale(80), borderRadius: scale(40), alignItems: "center", justifyContent: "center" },
  categoryIcon: { fontSize: moderateScale(32) },
  countBadgeSolid: { position: "absolute", top: scale(-4), right: scale(-4), backgroundColor: "#6366F1", paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(12), zIndex: 1 },
  countBadgeTextSolid: { color: "#FFFFFF", fontSize: moderateScale(10), fontWeight: "700" },
  categoryTitleCircle: { fontSize: moderateScale(12), fontWeight: "600", textAlign: "center", lineHeight: moderateScale(16), maxWidth: scale(90) },
});
