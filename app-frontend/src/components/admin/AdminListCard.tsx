import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
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
          padding: spacing.lg + 4,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Avatar */}
        {avatarText && (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: avatarColor || colors.primary,
              },
            ]}
          >
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {status && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(status.type) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(status.type) },
                  ]}
                >
                  {status.label}
                </Text>
              </View>
            )}
          </View>

          {/* Subtitle */}
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}

          {/* Meta */}
          {meta && (
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              {meta}
            </Text>
          )}
        </View>

        {/* Right Content */}
        {rightContent && (
          <View style={styles.rightContent}>{rightContent}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 15,
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  rightContent: {
    marginLeft: 12,
  },
});
