import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { ServiceRequest } from "../../../services/serviceRequest.service";
import { SERVICE_META } from "../services.constants";
import { SERVICE_ACCENT_MAP } from "../services.palette";
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
  const { fs, sp, isCompact } = useResponsiveLayout();
  const isDark = resolvedMode === "dark";
  const service = SERVICE_META[request.serviceType];
  const accent = SERVICE_ACCENT_MAP[request.serviceType];
  const accentColor = accent?.color ?? colors.primary;

  const cardBg = isDark ? "#1A1F2B" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,36,0.08)";

  const cardPadding = isCompact ? sp(12) : sp(14);
  const iconSize = isCompact ? sp(36) : sp(40);

  return (
    <View
      style={[
        styles.shadowWrap,
        {
          borderRadius: radius.lg,
          shadowColor: isDark ? "#000000" : "#0F1724",
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.card,
          {
            padding: cardPadding,
            paddingLeft: cardPadding + 4,
            gap: sp(10),
            borderRadius: radius.lg,
            backgroundColor: cardBg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: cardBorder,
          },
        ]}
      >
      {/* Left accent stripe — identifies the service at a glance */}
      <View
        style={[
          styles.accentStripe,
          {
            backgroundColor: accentColor,
            borderTopLeftRadius: radius.lg,
            borderBottomLeftRadius: radius.lg,
          },
        ]}
      />

      {/* Top row: icon + title + chevron */}
      <View style={[styles.header, { gap: sp(10) }]}>
        <View
          style={[
            styles.iconCircle,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
              backgroundColor: accentColor + (isDark ? "26" : "1A"),
            },
          ]}
        >
          {accent?.emoji ? (
            <Text style={{ fontSize: fs(17) }}>{accent.emoji}</Text>
          ) : (
            <Ionicons name={service.icon} size={fs(16)} color={accentColor} />
          )}
        </View>

        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.title,
              { fontSize: fs(14), color: colors.text },
            ]}
            numberOfLines={1}
          >
            {request.title || service.title}
          </Text>
          <Text
            style={[
              styles.serviceLabel,
              { fontSize: fs(11), color: accentColor },
            ]}
            numberOfLines={1}
          >
            {service.title}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={fs(16)} color={colors.textMuted} />
      </View>

      {/* Bottom: status + priority badges + date */}
      <View style={[styles.footer, { paddingLeft: iconSize + sp(10) }]}>
        <View style={styles.badgeRow}>
          <ServiceStatusBadge status={request.status} />
          <ServiceStatusBadge priority={request.priority} />
        </View>
        <Text style={[styles.date, { fontSize: fs(11), color: colors.textTertiary }]}>
          {formatDate(request.createdAt)}
        </Text>
      </View>

      {/* Latest admin status-change reason — surfaces when admin cancelled a
          previously-completed request so the requester knows WHY. We pull from
          statusHistory because the backend persists every change with a
          required `reason` field. */}
      {(() => {
        const showsReasonForStatus = ["cancelled", "rejected"].includes(request.status);
        if (!showsReasonForStatus) return null;
        const last = request.statusHistory && request.statusHistory.length > 0
          ? request.statusHistory[request.statusHistory.length - 1]
          : undefined;
        const reason = last?.reason?.trim();
        if (!reason) return null;
        return (
          <View
            style={{
              marginLeft: iconSize + sp(10),
              marginTop: sp(8),
              paddingHorizontal: sp(10),
              paddingVertical: sp(8),
              borderRadius: 10,
              backgroundColor: colors.error + "12",
              borderLeftWidth: 3,
              borderLeftColor: colors.error,
            }}
          >
            <Text style={[{ fontSize: fs(11), fontWeight: "800", color: colors.error, letterSpacing: 0.4, textTransform: "uppercase" }]}>
              {request.status === "rejected" ? "Rejection reason" : "Cancellation reason"}
            </Text>
            <Text style={[{ fontSize: fs(12), fontWeight: "600", color: colors.text, marginTop: 2, lineHeight: fs(17) }]}>
              {reason}
            </Text>
          </View>
        );
      })()}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    overflow: "hidden",
    position: "relative",
  },
  accentStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  serviceLabel: {
    marginTop: 2,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: { flexDirection: "row", gap: 6 },
  date: {
    fontWeight: "600",
  },
});
