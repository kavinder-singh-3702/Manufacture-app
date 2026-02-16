import {
  Modal,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";

type MenuItem = {
  label: string;
  description?: string;
  onPress: () => void;
  tone?: "default" | "danger";
  isActive?: boolean;
};

type SidebarMenuProps = {
  visible: boolean;
  onClose: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  menuItems: MenuItem[];
};

export const SidebarMenu = ({ visible, onClose, headerTitle, headerSubtitle, menuItems }: SidebarMenuProps) => {
  const { spacing, radius, colors, nativeGradients } = useTheme();
  const { resolvedMode, toggleMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const modeLabel = isDark ? "Dark mode" : "Light mode";
  const modeIcon = isDark ? "moon" : "sunny";

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]} />
        </TouchableWithoutFeedback>
        <SafeAreaView style={styles.panelSafeArea}>
          <LinearGradient
            colors={[colors.sidebarGradientStart, colors.sidebarGradientMid, colors.sidebarGradientEnd]}
            locations={[0, 0.52, 1]}
            style={[
              styles.panel,
              {
                padding: spacing.lg,
                borderTopRightRadius: radius.lg,
                borderBottomRightRadius: radius.lg,
              },
            ]}
          >
            <LinearGradient
              colors={nativeGradients.statusInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg }]}
            />

            <LinearGradient
              colors={nativeGradients.ctaPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.header,
                {
                  padding: spacing.lg,
                  borderRadius: radius.md,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <LinearGradient
                colors={[`${colors.textOnPrimary}1f`, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
              />

              <View style={styles.headerTopRow}>
                <View style={{ flex: 1 }}>
                  <Typography variant="subheading" color={colors.textOnPrimary} style={styles.headerTitle}>
                    {headerTitle}
                  </Typography>
                  {headerSubtitle ? (
                    <Typography
                      variant="body"
                      color={`${colors.textOnPrimary}b8`}
                      style={{ marginTop: spacing.xs, fontSize: 13, fontWeight: "600" }}
                    >
                      {headerSubtitle}
                    </Typography>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={toggleMode}
                  style={[
                    styles.themeToggleBtn,
                    {
                      backgroundColor: `${colors.textOnPrimary}33`,
                      borderRadius: radius.pill,
                      borderColor: `${colors.textOnPrimary}33`,
                    },
                  ]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch theme. Current ${modeLabel}`}
                >
                  <Ionicons name={modeIcon} size={16} color={colors.textOnPrimary} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.modePill,
                  {
                    borderRadius: radius.pill,
                    borderColor: `${colors.textOnPrimary}33`,
                    backgroundColor: `${colors.textOnPrimary}33`,
                  },
                ]}
              >
                <Ionicons name={modeIcon} size={13} color={colors.textOnPrimary} />
                <Typography variant="caption" color={colors.textOnPrimary} style={{ fontSize: 11, fontWeight: "700" }}>
                  {modeLabel}
                </Typography>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              showsVerticalScrollIndicator
              bounces
            >
              {menuItems.map((item, index) => {
                const isDanger = item.tone === "danger";
                const isActive = item.isActive || false;
                const isLastItem = index === menuItems.length - 1;

                const getItemStyles = () => {
                  if (isDanger) {
                    return {
                      bg: colors.errorBg,
                      border: colors.error,
                      shadowColor: colors.error,
                    };
                  }
                  if (isActive) {
                    return {
                      bg: colors.badgePrimary,
                      border: colors.primary,
                      shadowColor: colors.primary,
                    };
                  }
                  return {
                    bg: colors.surfaceElevated,
                    border: "transparent",
                    shadowColor: colors.shadow,
                  };
                };

                const itemStyles = getItemStyles();

                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.onPress}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: itemStyles.bg,
                        borderLeftWidth: 3,
                        borderLeftColor: itemStyles.border,
                        borderRadius: radius.md,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.md,
                        marginBottom: isLastItem ? 0 : spacing.sm,
                        shadowColor: itemStyles.shadowColor,
                        shadowOffset: { width: 0, height: isActive ? 4 : 2 },
                        shadowOpacity: isActive ? 0.22 : 0.1,
                        shadowRadius: isActive ? 8 : 4,
                        elevation: isActive ? 5 : 2,
                      },
                    ]}
                    activeOpacity={0.72}
                  >
                    <Typography variant="bodyStrong" color={isDanger ? colors.error : colors.text} style={styles.menuLabel}>
                      {item.label}
                    </Typography>
                    {item.description ? (
                      <Typography
                        variant="body"
                        color={isDanger ? colors.errorLight : colors.textMuted}
                        style={{ marginTop: spacing.xs, fontSize: 12 }}
                      >
                        {item.description}
                      </Typography>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    flex: 1,
    shadowOpacity: 0.18,
    shadowOffset: { width: -4, height: 0 },
    shadowRadius: 12,
    elevation: 15,
  },
  panelSafeArea: {
    width: "80%",
    maxWidth: 340,
  },
  header: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeToggleBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modePill: {
    marginTop: 10,
    alignSelf: "flex-start",
    minHeight: 24,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  listScroll: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  menuItem: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
