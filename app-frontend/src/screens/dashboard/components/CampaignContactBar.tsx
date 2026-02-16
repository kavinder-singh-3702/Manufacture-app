import { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

type CampaignContactBarProps = {
  onMessage?: () => void;
  onCall?: () => void;
  messageDisabled?: boolean;
  callDisabled?: boolean;
  compact?: boolean;
};

export const CampaignContactBar = memo(
  ({ onMessage, onCall, messageDisabled, callDisabled, compact }: CampaignContactBarProps) => {
    const { colors, radius, spacing } = useTheme();

    return (
      <View style={[styles.container, { marginTop: spacing.md, gap: compact ? 8 : 10 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onMessage}
          disabled={messageDisabled}
          style={[
            styles.actionButton,
            {
              borderRadius: radius.md,
              backgroundColor: colors.surface + "B3",
              borderColor: colors.border,
              opacity: messageDisabled ? 0.55 : 1,
              minHeight: compact ? 42 : 44,
            },
          ]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.text} />
          <Text style={[styles.actionLabel, { color: colors.text, fontSize: compact ? 13 : 14 }]}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCall}
          disabled={callDisabled}
          style={[
            styles.actionButton,
            {
              borderRadius: radius.md,
              backgroundColor: colors.surface + "B3",
              borderColor: colors.border,
              opacity: callDisabled ? 0.55 : 1,
              minHeight: compact ? 42 : 44,
            },
          ]}
        >
          <Ionicons name="call-outline" size={16} color={colors.text} />
          <Text style={[styles.actionLabel, { color: colors.text, fontSize: compact ? 13 : 14 }]}>Call</Text>
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});
