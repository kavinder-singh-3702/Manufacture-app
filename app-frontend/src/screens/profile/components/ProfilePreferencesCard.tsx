import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { ThemeMode } from "../../../theme";

type ProfilePreferencesCardProps = {
  themeMode: ThemeMode;
  locale?: string;
  timezone?: string;
  onOpenAppearance: () => void;
};

const humanTheme = (mode: ThemeMode) => {
  if (mode === "dark") return "Dark";
  if (mode === "light") return "Light";
  return "System";
};

export const ProfilePreferencesCard = ({
  themeMode,
  locale,
  timezone,
  onOpenAppearance,
}: ProfilePreferencesCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Preferences</Text>
      </View>

      <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <View style={[styles.leading, { backgroundColor: colors.primary + "16" }]}>
          <Ionicons name="color-palette-outline" size={17} color={colors.primary} />
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Theme mode</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{humanTheme(themeMode)}</Text>
        </View>
        <TouchableOpacity onPress={onOpenAppearance} style={[styles.inlineButton, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "16" }]}>
          <Text style={[styles.inlineButtonText, { color: colors.primary }]}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.metaGrid, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Locale</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{locale || "en-IN"}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Timezone</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{timezone || "UTC"}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  leading: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  inlineButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaGrid: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  metaDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(127,127,127,0.35)",
  },
});
