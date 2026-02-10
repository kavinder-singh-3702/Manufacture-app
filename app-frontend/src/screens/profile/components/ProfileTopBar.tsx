import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type ProfileTopBarProps = {
  title?: string;
  subtitle?: string;
  onBack: () => void;
  onOpenAppearance: () => void;
};

export const ProfileTopBar = ({
  title = "Profile",
  subtitle = "Personal workspace",
  onBack,
  onOpenAppearance,
}: ProfileTopBarProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.appearanceButton, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "18" }]}
        onPress={onOpenAppearance}
        accessibilityRole="button"
        accessibilityLabel="Open appearance settings"
      >
        <Ionicons name="contrast-outline" size={16} color={colors.primary} />
        <Text style={[styles.appearanceLabel, { color: colors.primary }]}>Theme</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  appearanceButton: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appearanceLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
});
