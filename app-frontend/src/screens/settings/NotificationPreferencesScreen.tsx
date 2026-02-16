import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { RootStackParamList } from "../../navigation/types";
import { notificationService, NotificationPreferences } from "../../services/notification.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const toLocalState = (preferences: NotificationPreferences) => ({
  ...preferences,
  quietHours: {
    enabled: preferences.quietHours?.enabled ?? false,
    start: preferences.quietHours?.start || "22:00",
    end: preferences.quietHours?.end || "08:00",
    timezone: preferences.quietHours?.timezone || "UTC",
  },
});

export const NotificationPreferencesScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { contentPadding, isXCompact, clamp } = useResponsiveLayout();
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getPreferences();
      setPrefs(toLocalState(response));
    } catch (err: any) {
      setError(err?.message || "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await notificationService.updatePreferences(prefs);
      setPrefs(toLocalState(updated));
    } catch (err: any) {
      setError(err?.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  const styles = useMemo(() => createStyles(colors, spacing, radius), [colors, spacing, radius]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textMuted }]}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!prefs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: colors.error }]}>{error || "Preferences unavailable"}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: contentPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { fontSize: clamp(isXCompact ? 16 : 17, 15, 17) }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
            Notification Preferences
          </Text>
          <Text style={styles.subtitle}>Control channels, quiet hours, and priority behavior</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} disabled={saving} onPress={save}>
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: contentPadding,
          paddingVertical: spacing.md,
          paddingBottom: spacing.xxl,
          gap: spacing.sm,
        }}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <SectionCard title="Master" styles={styles}>
          <SwitchRow
            label="Enable notifications"
            value={prefs.masterEnabled}
            onValueChange={(value) => setPrefs((prev) => (prev ? { ...prev, masterEnabled: value } : prev))}
            styles={styles}
          />
        </SectionCard>

        <SectionCard title="Channels" styles={styles}>
          <SwitchRow
            label="In-app"
            value={prefs.inAppEnabled}
            onValueChange={(value) => setPrefs((prev) => (prev ? { ...prev, inAppEnabled: value } : prev))}
            styles={styles}
          />
          <SwitchRow
            label="Push"
            value={prefs.pushEnabled}
            onValueChange={(value) => setPrefs((prev) => (prev ? { ...prev, pushEnabled: value } : prev))}
            styles={styles}
          />
          <SwitchRow
            label="Email"
            value={prefs.emailEnabled}
            onValueChange={(value) => setPrefs((prev) => (prev ? { ...prev, emailEnabled: value } : prev))}
            styles={styles}
          />
          <SwitchRow
            label="SMS"
            value={prefs.smsEnabled}
            onValueChange={(value) => setPrefs((prev) => (prev ? { ...prev, smsEnabled: value } : prev))}
            styles={styles}
          />
        </SectionCard>

        <SectionCard title="Quiet Hours" styles={styles}>
          <SwitchRow
            label="Enable quiet hours"
            value={prefs.quietHours.enabled}
            onValueChange={(value) =>
              setPrefs((prev) =>
                prev
                  ? {
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        enabled: value,
                      },
                    }
                  : prev
              )
            }
            styles={styles}
          />

          <View style={[styles.rowWrap, isXCompact ? styles.rowWrapCompact : null]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Start</Text>
              <TextInput
                value={prefs.quietHours.start}
                onChangeText={(value) =>
                  setPrefs((prev) =>
                    prev
                      ? {
                          ...prev,
                          quietHours: {
                            ...prev.quietHours,
                            start: value,
                          },
                        }
                      : prev
                  )
                }
                style={styles.input}
                placeholder="22:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>End</Text>
              <TextInput
                value={prefs.quietHours.end}
                onChangeText={(value) =>
                  setPrefs((prev) =>
                    prev
                      ? {
                          ...prev,
                          quietHours: {
                            ...prev.quietHours,
                            end: value,
                          },
                        }
                      : prev
                  )
                }
                style={styles.input}
                placeholder="08:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Timezone</Text>
          <TextInput
            value={prefs.quietHours.timezone}
            onChangeText={(value) =>
              setPrefs((prev) =>
                prev
                  ? {
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        timezone: value,
                      },
                    }
                  : prev
              )
            }
            style={styles.input}
            placeholder="Asia/Kolkata"
            placeholderTextColor={colors.textMuted}
          />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
};

type Styles = ReturnType<typeof createStyles>;

const SectionCard = ({ title, styles, children }: { title: string; styles: Styles; children: ReactNode }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const SwitchRow = ({
  label,
  value,
  onValueChange,
  styles,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  styles: Styles;
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + "88" }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  spacing: ReturnType<typeof useTheme>["spacing"],
  radius: ReturnType<typeof useTheme>["radius"]
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
    stateText: { fontSize: 13, fontWeight: "700" },
    retryBtn: {
      minHeight: 42,
      minWidth: 110,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    retryText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: "900" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: colors.text, fontSize: 17, fontWeight: "900" },
    subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },
    saveBtn: {
      minHeight: 36,
      minWidth: 70,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    saveText: { color: colors.text, fontSize: 12, fontWeight: "800" },
    errorCard: {
      borderWidth: 1,
      borderColor: colors.error + "55",
      backgroundColor: colors.error + "14",
      borderRadius: radius.md,
      paddingHorizontal: 10,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    errorText: { color: colors.error, fontSize: 12, fontWeight: "700", flex: 1 },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
    switchRow: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    switchLabel: { color: colors.text, fontSize: 13, fontWeight: "700", flex: 1 },
    rowWrap: { flexDirection: "row", gap: spacing.sm },
    rowWrapCompact: { flexDirection: "column", gap: spacing.xs },
    inputLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", marginTop: 2, marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated,
      color: colors.text,
      minHeight: 42,
      paddingHorizontal: 12,
      fontSize: 13,
      fontWeight: "600",
    },
  });

export default NotificationPreferencesScreen;
