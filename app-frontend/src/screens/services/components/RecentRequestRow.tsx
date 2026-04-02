import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { ServiceRequest } from "../../../services/serviceRequest.service";
import { SERVICE_META } from "../services.constants";
import { SERVICE_ACCENT_MAP, neu } from "../services.palette";
import { ServiceStatusBadge } from "./ServiceStatusBadge";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const RecentRequestRow = ({
  request,
  onPress,
}: {
  request: ServiceRequest;
  onPress?: () => void;
}) => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const service = SERVICE_META[request.serviceType];
  const accent = SERVICE_ACCENT_MAP[request.serviceType];

  return (
    <View style={[neu.lightShadow(isDark), { borderRadius: radius.lg }]}>
      <View style={[neu.darkShadow(isDark), { borderRadius: radius.lg }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          style={[
            styles.card,
            {
              borderRadius: radius.lg,
              backgroundColor: neu.cardBg(isDark),
            },
          ]}
        >
          {/* Top: icon + title + chevron */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                neu.pressed(isDark),
                {
                  borderRadius: 20,
                  backgroundColor: isDark ? `${accent.color}18` : (accent?.soft ?? "#E2E8F0"),
                },
              ]}
            >
              {accent?.emoji ? (
                <Text style={styles.emoji}>{accent.emoji}</Text>
              ) : (
                <Ionicons name={service.icon} size={16} color={accent?.color ?? colors.textMuted} />
              )}
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {request.title || service.title}
              </Text>
              <Text style={[styles.serviceLabel, { color: accent?.color ?? colors.textMuted }]}>
                {service.title}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>

          {/* Bottom: badges + date */}
          <View style={styles.footer}>
            <View style={styles.badgeRow}>
              <ServiceStatusBadge status={request.status} />
              <ServiceStatusBadge priority={request.priority} />
            </View>
            <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(request.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 17 },
  titleBlock: { flex: 1 },
  title: { fontSize: 14, fontWeight: "800", letterSpacing: -0.1 },
  serviceLabel: { marginTop: 2, fontSize: 11, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 50,
  },
  badgeRow: { flexDirection: "row", gap: 6 },
  date: { fontSize: 11, fontWeight: "600" },
});
