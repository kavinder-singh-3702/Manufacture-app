import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { ResponsiveScreen } from "../../components/layout";
import { RootStackParamList } from "../../navigation/types";
import { ThemeMode } from "../../theme";

const MODE_OPTIONS: Array<{
  id: ThemeMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "system", title: "System", subtitle: "Automatically follows your device appearance", icon: "phone-portrait-outline" },
  { id: "light", title: "Light", subtitle: "Bright interface for daylight and high clarity", icon: "sunny-outline" },
  { id: "dark", title: "Dark", subtitle: "Low-glare interface for focus and comfort", icon: "moon-outline" },
];

export const AppearanceScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { mode, resolvedMode, setMode } = useThemeMode();
  const { isCompact, contentPadding, clamp } = useResponsiveLayout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const preview = useMemo(
    () => ({
      canvas: [colors.surfaceCanvasStart, colors.surfaceCanvasEnd],
      card: colors.surface,
      text: colors.text,
      accent: colors.primary,
    }),
    [colors.primary, colors.surface, colors.surfaceCanvasEnd, colors.surfaceCanvasStart, colors.text]
  );

  return (
    <ResponsiveScreen scroll contentContainerStyle={{ padding: contentPadding, gap: spacing.md }} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surfaceElevated,
              width: isCompact ? 34 : 36,
              height: isCompact ? 34 : 36,
            },
          ]}
        > 
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text, fontSize: clamp(18, 16, 18) }]}>Appearance</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Theme mode for the whole app</Text>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        {MODE_OPTIONS.map((option) => {
          const isActive = mode === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.85}
              onPress={() => setMode(option.id)}
              style={[
                styles.option,
                {
                  backgroundColor: colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: isActive ? colors.primary + "1a" : colors.surfaceElevated }]}> 
                <Ionicons name={option.icon} size={18} color={isActive ? colors.primary : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>{option.subtitle}</Text>
              </View>
              <View style={[styles.checkWrap, { borderColor: isActive ? colors.primary : colors.border }]}> 
                {isActive ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}

        <View
          style={[
            styles.preview,
            { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.previewTitle, { color: colors.text }]}>Current mode preview</Text>
          <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>
            {mode === "system" ? `System (${resolvedMode})` : mode}
          </Text>

          <View style={[styles.previewSwatches, { marginTop: spacing.sm }]}> 
            <View style={[styles.swatch, { backgroundColor: preview.canvas[0] }]} />
            <View style={[styles.swatch, { backgroundColor: preview.card }]} />
            <View style={[styles.swatch, { backgroundColor: preview.accent }]} />
            <View style={[styles.swatch, { backgroundColor: preview.text }]} />
          </View>
        </View>
      </View>
    </ResponsiveScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontSize: 15, fontWeight: "800" },
  optionSubtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    borderWidth: 1,
    padding: 14,
  },
  previewTitle: { fontSize: 14, fontWeight: "800" },
  previewSubtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  previewSwatches: { flexDirection: "row", gap: 10 },
  swatch: { width: 40, height: 24, borderRadius: 6 },
});
