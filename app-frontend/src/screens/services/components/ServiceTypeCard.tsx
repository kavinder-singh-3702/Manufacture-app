import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { ServiceMeta } from "../services.constants";
import { neu, type ServiceAccent } from "../services.palette";

/* ─── Neumorphic wrapper ────────────────────────────────────────────── */

/** Dual-shadow neumorphic card wrapper (light highlight + dark shadow). */
const NeuCard = ({
  children,
  isDark,
  borderRadius,
  style,
}: {
  children: React.ReactNode;
  isDark: boolean;
  borderRadius: number;
  style?: any;
}) => (
  <View style={[neu.lightShadow(isDark), { borderRadius }, style]}>
    <View style={[neu.darkShadow(isDark), { borderRadius }]}>
      {children}
    </View>
  </View>
);

/* ─── Main component ────────────────────────────────────────────────── */

export const ServiceTypeCard = ({
  service,
  selected,
  onPress,
  onStart,
  accent,
}: {
  service: ServiceMeta;
  selected?: boolean;
  onPress?: () => void;
  onStart?: () => void;
  accent?: ServiceAccent;
}) => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  const accentColor = accent?.color ?? colors.primary;
  const cardBg = neu.cardBg(isDark);

  return (
    <NeuCard isDark={isDark} borderRadius={radius.xl}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            borderRadius: radius.xl,
            backgroundColor: selected ? `${accentColor}14` : cardBg,
          },
        ]}
      >
        {/* Top row: icon + info */}
        <View style={styles.header}>
          {/* Neumorphic inset icon circle */}
          <View
            style={[
              styles.iconCircle,
              neu.pressed(isDark),
              {
                borderRadius: 24,
                backgroundColor: isDark ? `${accentColor}18` : (accent?.soft ?? "#E2E8F0"),
              },
            ]}
          >
            {accent?.emoji ? (
              <Text style={styles.emoji}>{accent.emoji}</Text>
            ) : (
              <Ionicons name={service.icon} size={20} color={accentColor} />
            )}
          </View>

          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{service.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {service.subtitle}
            </Text>
          </View>
        </View>

        {/* Hint text */}
        <View
          style={[
            styles.hintRow,
            {
              backgroundColor: isDark ? `${accentColor}0D` : `${accentColor}08`,
              borderRadius: radius.sm,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={13} color={`${accentColor}99`} />
          <Text
            style={[styles.hint, { color: isDark ? colors.textMuted : colors.textTertiary }]}
            numberOfLines={1}
          >
            {service.quickHint}
          </Text>
        </View>

        {/* CTA Button — neumorphic raised, solid accent */}
        {onStart ? (
          <TouchableOpacity
            onPress={onStart}
            activeOpacity={0.85}
            style={[
              styles.ctaOuter,
              neu.buttonRaised(isDark),
              { borderRadius: radius.lg },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? [accentColor, `${accentColor}CC`]
                  : [accentColor, `${accentColor}DD`]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.ctaGradient, { borderRadius: radius.lg }]}
            >
              <Text style={styles.ctaText}>Start request</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </NeuCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 22 },
  titleBlock: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  subtitle: { marginTop: 3, fontSize: 12, fontWeight: "500", lineHeight: 17 },

  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hint: { flex: 1, fontSize: 11, fontWeight: "600" },

  ctaOuter: {
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  ctaArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
});
