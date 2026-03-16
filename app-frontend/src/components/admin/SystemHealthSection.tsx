import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { KPICard, KPICardGrid } from "../ui/KPICard";
import type { AdminStats, AdminOverview } from "../../services/admin.service";

type SystemHealthSectionProps = {
  stats: AdminStats | null;
  overview: AdminOverview | null;
  loading?: boolean;
};

const LiveDot = () => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.liveRow}>
      <Animated.View style={[styles.liveDot, { backgroundColor: colors.success, opacity: pulseAnim }]} />
      <Text style={[styles.liveText, { color: colors.success }]}>Live Update</Text>
    </View>
  );
};

export const SystemHealthSection = ({ stats, overview }: SystemHealthSectionProps) => {
  const { colors, radius } = useTheme();

  const activeMfg = stats?.companies?.active ?? 0;
  const pendingCount = overview?.servicesQueue?.pending ?? stats?.verifications?.pending ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SYSTEM HEALTH</Text>
        <LiveDot />
      </View>

      <KPICardGrid>
        <KPICard title="ACTIVE MFG" value={activeMfg} trend={12} trendSuffix="%" />
        <KPICard title="PENDING" value={pendingCount} />
      </KPICardGrid>

      <View
        style={[
          styles.volumeCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 2,
            borderColor: colors.text + "30",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          },
        ]}
      >
        <Text style={[styles.volumeLabel, { color: colors.textSecondary }]}>TOTAL VOLUME (24H)</Text>
        <View style={styles.volumeRow}>
          <Text style={[styles.volumeValue, { color: colors.text }]}>
            ${((overview?.campaigns?.total ?? 0) * 0.1).toFixed(1)}M
          </Text>
          <View style={[styles.stableBadge, { backgroundColor: colors.success + "16", borderColor: colors.success, borderWidth: 1 }]}>
            <Text style={[styles.stableBadgeText, { color: colors.success }]}>STABLE</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: "700" },
  volumeCard: { padding: 16 },
  volumeLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  volumeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  volumeValue: { fontSize: 28, fontWeight: "800" },
  stableBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  stableBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
});
