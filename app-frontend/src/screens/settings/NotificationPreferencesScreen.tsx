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

type SaveStatus = "idle" | "saving" | "saved" | "error";

export const NotificationPreferencesScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { contentPadding, isXCompact, clamp } = useResponsiveLayout();
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  // Free-text fields (quiet-hours start/end, timezone) get a local draft
  // committed on blur — unlike the toggles, persisting on every keystroke
  // would send incomplete values ("2", "22", "22:") to the API mid-type.
  const [startDraft, setStartDraft] = useState("");
  const [endDraft, setEndDraft] = useState("");
  const [timezoneDraft, setTimezoneDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getPreferences();
      const local = toLocalState(response);
      setPrefs(local);
      setStartDraft(local.quietHours.start);
      setEndDraft(local.quietHours.end);
      setTimezoneDraft(local.quietHours.timezone);
    } catch (err: any) {
      setError(err?.message || "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Autosaves on every toggle/blur instead of requiring a manual "Save" tap
  // — matches web-frontend's NotificationPreferencesCard.tsx, and means a
  // toggle actually takes effect if the admin navigates away without
  // remembering to tap Save (A5).
  const persist = useCallback(async (patch: Partial<NotificationPreferences>, optimistic: NotificationPreferences) => {
    const previous = prefs;
    setPrefs(optimistic);
    setSaveStatus("saving");
    try {
      const updated = await notificationService.updatePreferences(patch);
      const local = toLocalState(updated);
      setPrefs(local);
      setStartDraft(local.quietHours.start);
      setEndDraft(local.quietHours.end);
      setTimezoneDraft(local.quietHours.timezone);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (err: any) {
      setPrefs(previous);
      setError(err?.message || "Failed to save preferences");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [prefs]);

  const toggleField = useCallback(
    (key: "masterEnabled" | "inAppEnabled" | "pushEnabled" | "emailEnabled" | "smsEnabled") => {
      if (!prefs) return;
      const next = { ...prefs, [key]: !prefs[key] };
      void persist({ [key]: next[key] }, next);
    },
    [prefs, persist]
  );

  const toggleQuietHours = useCallback(() => {
    if (!prefs) return;
    const next = { ...prefs, quietHours: { ...prefs.quietHours, enabled: !prefs.quietHours.enabled } };
    void persist({ quietHours: next.quietHours }, next);
  }, [prefs, persist]);

  const commitQuietTime = useCallback(
    (which: "start" | "end", value: string) => {
      if (!prefs || value === prefs.quietHours[which]) return;
      const next = { ...prefs, quietHours: { ...prefs.quietHours, [which]: value } };
      void persist({ quietHours: next.quietHours }, next);
    },
    [prefs, persist]
  );

  const commitTimezone = useCallback(() => {
    if (!prefs || timezoneDraft === prefs.quietHours.timezone) return;
    const next = { ...prefs, quietHours: { ...prefs.quietHours, timezone: timezoneDraft } };
    void persist({ quietHours: next.quietHours }, next);
  }, [prefs, timezoneDraft, persist]);

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
        {saveStatus === "saving" && <Text style={styles.saveStatusText}>Saving…</Text>}
        {saveStatus === "saved" && <Text style={[styles.saveStatusText, { color: colors.success }]}>✓ Saved</Text>}
        {saveStatus === "error" && <Text style={[styles.saveStatusText, { color: colors.error }]}>Failed to save</Text>}
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
            onValueChange={() => toggleField("masterEnabled")}
            styles={styles}
          />
        </SectionCard>

        <SectionCard title="Channels" styles={styles}>
          <SwitchRow
            label="In-app"
            value={prefs.inAppEnabled}
            disabled={!prefs.masterEnabled}
            onValueChange={() => toggleField("inAppEnabled")}
            styles={styles}
          />
          <SwitchRow
            label="Push"
            value={prefs.pushEnabled}
            disabled={!prefs.masterEnabled}
            onValueChange={() => toggleField("pushEnabled")}
            styles={styles}
          />
          <SwitchRow
            label="Email"
            value={prefs.emailEnabled}
            disabled={!prefs.masterEnabled}
            onValueChange={() => toggleField("emailEnabled")}
            styles={styles}
          />
          <SwitchRow
            label="SMS"
            value={prefs.smsEnabled}
            disabled={!prefs.masterEnabled}
            onValueChange={() => toggleField("smsEnabled")}
            styles={styles}
          />
        </SectionCard>

        <SectionCard title="Quiet Hours" styles={styles}>
          <SwitchRow
            label="Enable quiet hours"
            value={prefs.quietHours.enabled}
            disabled={!prefs.masterEnabled}
            onValueChange={toggleQuietHours}
            styles={styles}
          />

          <View style={[styles.rowWrap, isXCompact ? styles.rowWrapCompact : null]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Start</Text>
              <TextInput
                value={startDraft}
                onChangeText={setStartDraft}
                onBlur={() => commitQuietTime("start", startDraft)}
                style={styles.input}
                placeholder="22:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>End</Text>
              <TextInput
                value={endDraft}
                onChangeText={setEndDraft}
                onBlur={() => commitQuietTime("end", endDraft)}
                style={styles.input}
                placeholder="08:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Timezone</Text>
          <TextInput
            value={timezoneDraft}
            onChangeText={setTimezoneDraft}
            onBlur={commitTimezone}
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
  disabled,
  styles,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  styles: Styles;
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.switchRow, disabled ? { opacity: 0.5 } : null]}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        disabled={disabled}
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
    saveStatusText: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
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
