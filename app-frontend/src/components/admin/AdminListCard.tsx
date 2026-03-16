import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

type StatusType = "success" | "warning" | "error" | "neutral";

type AdminListCardProps = {
  title: string;
  subtitle?: string;
  avatarText?: string;
  avatarColor?: string;
  status?: {
    label: string;
    type: StatusType;
  };
  meta?: string;
  onPress?: () => void;
  rightContent?: ReactNode;
  style?: ViewStyle;
};

export const AdminListCard = ({
  title,
  subtitle,
  avatarText,
  avatarColor,
  status,
  meta,
  onPress,
  rightContent,
  style,
}: AdminListCardProps) => {
  const { colors, radius, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const getStatusColor = (type: StatusType) => {
    switch (type) {
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      case "error":
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: isCompact ? spacing.md : spacing.lg,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {avatarText && (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: avatarColor || colors.primary,
                width: isCompact ? 44 : 50,
                height: isCompact ? 44 : 50,
                borderRadius: isCompact ? 14 : 16,
                marginRight: isCompact ? 12 : 16,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.textOnPrimary, fontSize: isCompact ? 16 : 20 }]}>{avatarText}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.text, fontSize: isCompact ? 15 : 16 }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {status && (
              <View style={[styles.statusPill, { backgroundColor: getStatusColor(status.type) + "16", borderWidth: 1, borderColor: getStatusColor(status.type) + "30" }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status.type) }]} />
                <Text
                  style={[styles.statusText, { color: getStatusColor(status.type), fontSize: isCompact ? 11 : 12 }]}
                >
                  {status.label}
                </Text>
              </View>
            )}
          </View>

          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary, fontSize: isCompact ? 13 : 14 }]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}

          {meta && (
            <Text style={[styles.meta, { color: colors.textMuted, fontSize: isCompact ? 12 : 13 }]}>
              {meta}
            </Text>
          )}
        </View>

        {rightContent && (
          <View style={styles.rightContent}>{rightContent}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontWeight: "700",
    textTransform: "capitalize",
  },
  subtitle: {
    lineHeight: 18,
    fontWeight: "500",
  },
  meta: {
    marginTop: 2,
    fontWeight: "600",
  },
  rightContent: {
    marginLeft: 12,
  },
});
