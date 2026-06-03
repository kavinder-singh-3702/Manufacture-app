import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { ServiceMeta } from "../services.constants";
import type { ServiceAccent } from "../services.palette";

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
  const { fs, sp, isCompact } = useResponsiveLayout();

  const accentColor = accent?.color ?? colors.primary;
  const gradientColors: [string, string, ...string[]] = accent?.gradient ?? ["#1F2937", "#0F1115"];
  const glow = accent?.glow ?? "rgba(0,0,0,0.35)";

  const cardPadding = isCompact ? sp(14) : sp(16);
  const iconSize = isCompact ? sp(48) : sp(52);
  const orbSize = isCompact ? sp(140) : sp(160);

  return (
    <View
      style={[
        styles.shadowWrap,
        {
          borderRadius: radius.xl,
          shadowColor: glow,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        style={{ borderRadius: radius.xl }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              padding: cardPadding,
              gap: sp(12),
              borderRadius: radius.xl,
              borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
              borderColor: selected ? accentColor : "rgba(255,255,255,0.10)",
            },
          ]}
        >
          {/* Top-right decorative glow blob */}
          <View
            pointerEvents="none"
            style={[
              styles.decorOrb,
              {
                width: orbSize,
                height: orbSize,
                borderRadius: orbSize / 2,
                top: -orbSize / 2.6,
                right: -orbSize / 2.6,
                backgroundColor: accentColor + "26",
              },
            ]}
          />

          {/* Top row: icon + info */}
          <View style={[styles.header, { gap: sp(12) }]}>
            <View
              style={[
                styles.iconCircle,
                {
                  width: iconSize,
                  height: iconSize,
                  borderRadius: iconSize / 2,
                  backgroundColor: "rgba(255,255,255,0.10)",
                  borderColor: "rgba(255,255,255,0.18)",
                },
              ]}
            >
              {accent?.emoji ? (
                <Text style={{ fontSize: fs(22) }}>{accent.emoji}</Text>
              ) : (
                <Ionicons name={service.icon} size={fs(22)} color="#FFFFFF" />
              )}
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.title, { fontSize: fs(16) }]}>{service.title}</Text>
              <Text
                style={[styles.subtitle, { fontSize: fs(12), lineHeight: fs(17) }]}
                numberOfLines={2}
              >
                {service.subtitle}
              </Text>
            </View>
          </View>

          {/* Hint pill */}
          <View
            style={[
              styles.hintRow,
              {
                paddingHorizontal: sp(10),
                paddingVertical: sp(7),
                borderRadius: radius.sm,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.10)",
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={fs(13)} color="rgba(255,255,255,0.78)" />
            <Text style={[styles.hint, { fontSize: fs(11) }]} numberOfLines={1}>
              {service.quickHint}
            </Text>
          </View>

          {/* CTA — frosted white pill */}
          {onStart ? (
            <TouchableOpacity
              onPress={onStart}
              activeOpacity={0.88}
              style={[
                styles.ctaOuter,
                { borderRadius: radius.lg },
              ]}
            >
              <View
                style={[
                  styles.ctaInner,
                  {
                    paddingVertical: sp(12),
                    paddingHorizontal: sp(16),
                    borderRadius: radius.lg,
                    backgroundColor: "rgba(255,255,255,0.96)",
                  },
                ]}
              >
                <Text style={[styles.ctaText, { fontSize: fs(13), color: accentColor }]}>Start request</Text>
                <View style={[styles.ctaArrow, { backgroundColor: accentColor }]}>
                  <Ionicons name="arrow-forward" size={fs(13)} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    overflow: "hidden",
    position: "relative",
  },
  decorOrb: {
    position: "absolute",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: {
    fontWeight: "800",
    letterSpacing: -0.2,
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 4,
    fontWeight: "500",
    color: "rgba(255,255,255,0.74)",
  },

  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    flex: 1,
    fontWeight: "600",
    color: "rgba(255,255,255,0.86)",
  },

  ctaOuter: {
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.35)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ctaArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
