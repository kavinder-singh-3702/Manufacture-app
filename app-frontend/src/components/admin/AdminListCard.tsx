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
          shadowColor: colors.shadow,
          borderRadius: radius.lg,
          padding: isCompact ? spacing.md : spacing.lg,
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
                width: isCompact ? 44 : 52,
                height: isCompact ? 44 : 52,
                borderRadius: isCompact ? 22 : 26,
                marginRight: isCompact ? 12 : 16,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.textOnPrimary, fontSize: isCompact ? 16 : 20 }]}>{avatarText}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.text, fontSize: isCompact ? 15 : 17 }]}
              numberOfLines={2}
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
                    { color: getStatusColor(status.type), fontSize: isCompact ? 12 : 13 },
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
              style={[styles.subtitle, { color: colors.textMuted, fontSize: isCompact ? 13 : 14 }]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}

          {/* Meta */}
          {meta && (
            <Text style={[styles.meta, { color: colors.textTertiary, fontSize: isCompact ? 12 : 13 }]}>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
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
    maxWidth: "100%",
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
    lineHeight: 18,
  },
  meta: {
    marginTop: 2,
  },
  rightContent: {
    marginLeft: 12,
  },
});
