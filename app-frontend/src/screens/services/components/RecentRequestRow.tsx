import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { ServiceRequest } from "../../../services/serviceRequest.service";
import { SERVICE_META } from "../services.constants";
import { ServiceStatusBadge } from "./ServiceStatusBadge";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const RecentRequestRow = ({
  request,
  onPress,
  onQuickAction,
}: {
  request: ServiceRequest;
  onPress?: () => void;
  onQuickAction?: () => void;
}) => {
  const { colors, radius } = useTheme();
  const service = SERVICE_META[request.serviceType];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.row, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <View style={[styles.iconWrap, { borderRadius: radius.md, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
        <Ionicons name={service.icon} size={16} color={colors.textMuted} />
      </View>

      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {request.title || service.title}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(request.createdAt)}</Text>
        </View>

        <View style={styles.metaRow}>
          <ServiceStatusBadge status={request.status} />
          <ServiceStatusBadge priority={request.priority} />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onQuickAction}
        style={[styles.quickButton, { borderRadius: radius.pill, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
      >
        <Text style={[styles.quickButtonText, { color: colors.primary }]}>New</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 6 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { flex: 1, fontSize: 13, fontWeight: "800" },
  date: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 6 },
  quickButton: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  quickButtonText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
});
