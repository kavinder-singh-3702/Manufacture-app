import { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  tone?: "default" | "danger";
};

const NEU_LIGHT = "#EDF1F7";
const NEU_DARK = "#1A1F2B";
const NEU_INSET_LIGHT = "#E2E8F0";
const NEU_INSET_DARK = "#151A24";
const neuRaised = (isDark: boolean) => isDark ? { shadowColor: "#000", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 } : { shadowColor: "#A3B1C6", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 };
const neuPressed = (isDark: boolean) => isDark ? { shadowColor: "#000", shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 1 } : { shadowColor: "#A3B1C6", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 1 };
const neuCardBg = (isDark: boolean) => isDark ? NEU_DARK : NEU_LIGHT;
const neuInsetBg = (isDark: boolean) => isDark ? NEU_INSET_DARK : NEU_INSET_LIGHT;

export const AdminSettingsScreen = () => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const { logout, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "MANAGEMENT",
      items: [
        {
          icon: "people",
          label: "User Management",
          description: "View and manage all users",
          onPress: () => navigation.navigate("AdminUsers"),
        },
        {
          icon: "business",
          label: "Companies",
          description: "Manage company profiles and status",
          onPress: () => navigation.navigate("AdminCompanies"),
        },
        {
          icon: "checkbox",
          label: "Verifications",
          description: "Review pending verification requests",
          onPress: () => navigation.navigate("AdminVerifications"),
        },
      ],
    },
    {
      title: "TOOLS",
      items: [
        {
          icon: "notifications",
          label: "Notification Studio",
          description: "Dispatch and track notifications",
          onPress: () => navigation.navigate("NotificationStudio"),
        },
        {
          icon: "megaphone",
          label: "Ad Studio",
          description: "Create targeted advertisements",
          onPress: () => navigation.navigate("AdStudio"),
        },
      ],
    },
    {
      title: "PREFERENCES",
      items: [
        {
          icon: "color-palette",
          label: "Appearance",
          description: "Theme and display settings",
          onPress: () => navigation.navigate("Appearance"),
        },
        {
          icon: "person",
          label: "Profile",
          description: "Manage your personal details",
          onPress: () => navigation.navigate("Profile"),
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: "log-out",
          label: "Logout",
          description: "Sign out of the workspace",
          onPress: handleLogout,
          tone: "danger",
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        {user?.email && (
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
        )}
      </View>

      {sections.map((section) => (
        <View key={section.title || "logout"} style={styles.section}>
          {section.title ? (
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
          ) : null}
          <View style={[styles.sectionCard, {
            backgroundColor: neuCardBg(isDark),
            borderRadius: radius.xl,
            ...neuRaised(isDark),
          }]}>
            {section.items.map((item, idx) => {
              const isDanger = item.tone === "danger";
              const iconColor = isDanger ? colors.error : colors.primary;
              const textColor = isDanger ? colors.error : colors.text;

              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={[
                    styles.settingsItem,
                    {
                      backgroundColor: neuInsetBg(isDark),
                      borderRadius: radius.lg,
                      marginHorizontal: 6,
                      marginVertical: 4,
                      ...neuPressed(isDark),
                    },
                  ]}
                >
                  <View style={[styles.settingsIcon, { backgroundColor: iconColor + "14" }]}>
                    <Ionicons name={item.icon} size={20} color={iconColor} />
                  </View>
                  <View style={styles.settingsText}>
                    <Text style={[styles.settingsLabel, { color: textColor }]}>{item.label}</Text>
                    <Text style={[styles.settingsDesc, { color: colors.textMuted }]}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  email: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginLeft: 4 },
  sectionCard: { overflow: "hidden", paddingVertical: 4 },
  settingsItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  settingsIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingsText: { flex: 1, gap: 2 },
  settingsLabel: { fontSize: 15, fontWeight: "700" },
  settingsDesc: { fontSize: 13, fontWeight: "500" },
});
