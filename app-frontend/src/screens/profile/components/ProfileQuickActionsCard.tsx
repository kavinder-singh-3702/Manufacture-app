import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type ProfileQuickActionsCardProps = {
  actions: QuickAction[];
};

export const ProfileQuickActionsCard = ({ actions }: ProfileQuickActionsCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            onPress={action.onPress}
            activeOpacity={0.85}
            style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + "16" }]}>
              <Ionicons name={action.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={2}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    width: "48%",
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
});
