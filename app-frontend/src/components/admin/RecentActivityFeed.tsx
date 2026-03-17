import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import type { AdminAuditEvent } from "../../services/admin.service";

type RecentActivityFeedProps = {
  events: AdminAuditEvent[];
};

type ActionConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: "primary" | "success" | "warning" | "error";
};

const getActionConfig = (action: string): ActionConfig => {
  if (action.includes("verification") || action.includes("decided"))
    return { icon: "shield-checkmark", colorKey: "success" };
  if (action.includes("company") && action.includes("status"))
    return { icon: "business", colorKey: "warning" };
  if (action.includes("archived") || action.includes("delete"))
    return { icon: "trash", colorKey: "error" };
  if (action.includes("product") && action.includes("created"))
    return { icon: "cube", colorKey: "success" };
  if (action.includes("product") && (action.includes("updated") || action.includes("quantity")))
    return { icon: "cube", colorKey: "primary" };
  if (action.includes("variant"))
    return { icon: "layers", colorKey: "primary" };
  if (action.includes("image"))
    return { icon: "image", colorKey: "primary" };
  if (action.includes("service-request") || action.includes("business-setup"))
    return { icon: "construct", colorKey: "warning" };
  if (action.includes("documents"))
    return { icon: "document-text", colorKey: "warning" };
  return { icon: "ellipse", colorKey: "primary" };
};

const formatTimeAgo = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const RecentActivityFeed = ({ events }: RecentActivityFeedProps) => {
  const { colors, radius } = useTheme();

  if (!events.length) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT ACTIVITY</Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 2,
            borderColor: colors.text + "30",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 6,
            elevation: 2,
          },
        ]}
      >
        {events.map((event, index) => {
          const config = getActionConfig(event.action);
          const color = colors[config.colorKey];
          const isLast = index === events.length - 1;

          return (
            <View key={event.id} style={styles.row}>
              {/* Timeline line + dot */}
              <View style={styles.timeline}>
                <View style={[styles.dot, { backgroundColor: color + "20", borderColor: color }]}>
                  <Ionicons name={config.icon} size={12} color={color} />
                </View>
                {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
              </View>

              {/* Content */}
              <View style={[styles.content, !isLast && { paddingBottom: 16 }]}>
                <Text style={[styles.eventLabel, { color: colors.text }]} numberOfLines={2}>
                  {event.label ?? event.action.replace(/\./g, " ").replace(/^admin /, "")}
                </Text>
                {event.description ? (
                  <Text style={[styles.eventDesc, { color: colors.textMuted }]} numberOfLines={1}>
                    {event.description}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  {event.actor?.displayName ? (
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {event.actor.displayName}
                    </Text>
                  ) : null}
                  <Text style={[styles.metaTime, { color: colors.textMuted }]}>
                    {formatTimeAgo(event.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  card: {
    padding: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
  },
  timeline: {
    width: 32,
    alignItems: "center",
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 1.5,
    flex: 1,
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginLeft: 10,
    paddingTop: 2,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  eventDesc: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaTime: {
    fontSize: 11,
    fontWeight: "600",
  },
});
